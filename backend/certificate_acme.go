package main

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/acme"
)

const (
	certificateProduction = "https://acme-v02.api.letsencrypt.org/directory"
	certificateStaging    = "https://acme-staging-v02.api.letsencrypt.org/directory"
)

var errCertificateDNS = errors.New("DNS record not visible")
var errCertificateRejected = errors.New("ACME order rejected")

type certificateRecord struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type certificateChallenge struct {
	record        certificateRecord
	authorization string
	challenge     *acme.Challenge
}

type certificateOrder struct {
	uri        string
	expires    time.Time
	challenges []certificateChallenge
}

type certificateAuthority interface {
	start(context.Context, []string) (certificateOrder, error)
	issue(context.Context, certificateOrder, []byte) ([][]byte, error)
}

type letsEncryptAuthority struct {
	client     *acme.Client
	email      string
	accountMu  sync.Mutex
	registered bool
	lookupTXT  func(context.Context, string) ([]string, error)
}

func readACMEAccountKey(encoded string) (crypto.Signer, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, err
	}
	block, rest := pem.Decode(data)
	if block == nil || len(strings.TrimSpace(string(rest))) != 0 {
		return nil, errors.New("invalid account key")
	}
	var key any
	switch block.Type {
	case "PRIVATE KEY":
		key, err = x509.ParsePKCS8PrivateKey(block.Bytes)
	case "EC PRIVATE KEY":
		key, err = x509.ParseECPrivateKey(block.Bytes)
	default:
		return nil, errors.New("expected an EC account key")
	}
	ec, ok := key.(*ecdsa.PrivateKey)
	if err != nil || !ok || ec.Curve.Params().BitSize != 256 {
		return nil, errors.New("expected a P-256 account key")
	}
	return ec, nil
}

func newLetsEncryptAuthority(key crypto.Signer, email string, staging bool) *letsEncryptAuthority {
	directory := certificateProduction
	if staging {
		directory = certificateStaging
	}
	return &letsEncryptAuthority{
		client: &acme.Client{Key: key, DirectoryURL: directory, HTTPClient: &http.Client{
			Timeout:       12 * time.Second,
			CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
		}},
		email:     email,
		lookupTXT: net.DefaultResolver.LookupTXT,
	}
}

func (a *letsEncryptAuthority) account(ctx context.Context) error {
	a.accountMu.Lock()
	defer a.accountMu.Unlock()
	if a.registered {
		return nil
	}
	_, err := a.client.Register(ctx, &acme.Account{Contact: []string{"mailto:" + a.email}}, acme.AcceptTOS)
	if err != nil && !errors.Is(err, acme.ErrAccountAlreadyExists) {
		return err
	}
	a.registered = true
	return nil
}

func (a *letsEncryptAuthority) start(ctx context.Context, domains []string) (certificateOrder, error) {
	if err := a.account(ctx); err != nil {
		return certificateOrder{}, err
	}
	remote, err := a.client.AuthorizeOrder(ctx, acme.DomainIDs(domains...))
	if err != nil {
		return certificateOrder{}, err
	}
	order := certificateOrder{uri: remote.URI, expires: remote.Expires}
	if order.uri == "" {
		return certificateOrder{}, errCertificateRejected
	}
	// Even when a CA reuses prior authorizations, do not let a new web session
	// obtain a key pair for that name without proving DNS control again.
	// The service adds a separate random TXT proof for every requested name.
	for _, address := range remote.AuthzURLs {
		auth, err := a.client.GetAuthorization(ctx, address)
		if err != nil {
			return certificateOrder{}, err
		}
		if auth.Status == acme.StatusValid {
			continue
		}
		if auth.Status != acme.StatusPending {
			return certificateOrder{}, errCertificateRejected
		}
		found := false
		for _, challenge := range auth.Challenges {
			if challenge.Type != "dns-01" {
				continue
			}
			value, err := a.client.DNS01ChallengeRecord(challenge.Token)
			if err != nil {
				return certificateOrder{}, err
			}
			name := "_acme-challenge." + strings.TrimPrefix(auth.Identifier.Value, "*.")
			order.challenges = append(order.challenges, certificateChallenge{certificateRecord{name, value}, address, challenge})
			found = true
			break
		}
		if !found {
			return certificateOrder{}, errCertificateRejected
		}
	}
	return order, nil
}

func checkCertificateRecords(ctx context.Context, lookup func(context.Context, string) ([]string, error), records []certificateRecord) error {
	answers := make(map[string][]string)
	for _, record := range records {
		txt, ok := answers[record.Name]
		if !ok {
			var err error
			txt, err = lookup(ctx, record.Name+".")
			if err != nil {
				return errCertificateDNS
			}
			answers[record.Name] = txt
		}
		matched := false
		for _, answer := range txt {
			if answer == record.Value {
				matched = true
				break
			}
		}
		if !matched {
			return errCertificateDNS
		}
	}
	return nil
}

func (a *letsEncryptAuthority) issue(ctx context.Context, order certificateOrder, csr []byte) ([][]byte, error) {
	current, err := a.client.GetOrder(ctx, order.uri)
	if err != nil {
		return nil, err
	}
	if current.Status == acme.StatusPending {
		for _, item := range order.challenges {
			auth, err := a.client.GetAuthorization(ctx, item.authorization)
			if err != nil {
				return nil, err
			}
			if auth.Status == acme.StatusValid {
				continue
			}
			if auth.Status != acme.StatusPending {
				return nil, errCertificateRejected
			}
			var challenge *acme.Challenge
			for _, candidate := range auth.Challenges {
				if candidate.URI == item.challenge.URI {
					challenge = candidate
					break
				}
			}
			if challenge == nil || challenge.Status == acme.StatusInvalid {
				return nil, errCertificateRejected
			}
			if challenge.Status == acme.StatusPending {
				if _, err := a.client.Accept(ctx, challenge); err != nil {
					return nil, err
				}
			}
			if _, err := a.client.WaitAuthorization(ctx, item.authorization); err != nil {
				var rejected *acme.AuthorizationError
				if errors.As(err, &rejected) {
					return nil, errCertificateRejected
				}
				return nil, err
			}
		}
	}
	if current.Status == acme.StatusPending || current.Status == acme.StatusProcessing {
		current, err = a.client.WaitOrder(ctx, order.uri)
		if err != nil {
			var rejected *acme.OrderError
			if errors.As(err, &rejected) {
				return nil, errCertificateRejected
			}
			return nil, err
		}
	}
	switch current.Status {
	case acme.StatusValid:
		return a.client.FetchCert(ctx, current.CertURL, true)
	case acme.StatusReady:
		chain, _, err := a.client.CreateOrderCert(ctx, current.FinalizeURL, csr, true)
		return chain, err
	default:
		return nil, errCertificateRejected
	}
}
