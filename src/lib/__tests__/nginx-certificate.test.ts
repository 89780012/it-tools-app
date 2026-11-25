// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { X509Certificate, createPrivateKey, createPublicKey, sign, verify, webcrypto } from 'node:crypto'
import JSZip from 'jszip'
import { certificateDomains, preparePublicCertificate, generateLocalCertificate, certificateBundle, type PublicCertificateOptions } from '../nginx-certificate'

const defaults: PublicCertificateOptions = { domains: 'example.com\nwww.example.com', email: 'admin@example.com', algorithm: 'ecdsa', challenge: 'nginx', webroot: '/var/www/letsencrypt', credentials: '/etc/letsencrypt/cloudflare.ini', port: 8080, staging: false, agreed: true }

describe('certificate domain normalization and injection boundaries', () => {
  it('normalizes case, duplicates, trailing dots, IDNA and wildcard SANs', () => {
    expect(certificateDomains('EXAMPLE.com. www.example.com,example.com')).toEqual(['example.com', 'www.example.com'])
    expect(certificateDomains('例子.公司')).toEqual(['xn--fsqu00a.xn--55qx5d'])
    expect(certificateDomains('*.example.com example.com')).toEqual(['*.example.com', 'example.com'])
    expect(certificateDomains('localhost *.example.test', true)).toEqual(['localhost', '*.example.test'])
  })
  it.each(['', 'https://example.com', 'example.com:443', '127.0.0.1', '2130706433', '0x7f000001', '[::1]', '*.com', 'foo.*.example.com', 'foo_bar.example.com', 'example.com;reboot', '$(touch /tmp/x).com', 'example.com{bad}', '-x.example.com', '.example.com', 'a..example.com', 'foo.local', 'localhost', 'foo.test', 'a'.repeat(64)+'.com'])('rejects unsupported or unsafe domain input %s', input => expect(() => certificateDomains(input)).toThrow('errorDomains'))
  it('bounds SAN count and input length', () => {
    expect(() => certificateDomains(Array.from({length:21},(_,i)=>`a${i}.example.com`).join(' '))).toThrow('errorDomains')
    expect(() => certificateDomains('a'.repeat(6001))).toThrow('errorDomains')
  })
})

describe('Let’s Encrypt command and Nginx configuration generation', () => {
  it.each(['nginx', 'webroot', 'cloudflare'] as const)('generates a coherent %s deployment and renewal plan', challenge => {
    const result = preparePublicCertificate({ ...defaults, challenge })
    expect(result.issue).toContain("--cert-name 'example.com'")
    expect(result.issue).toContain("-d 'example.com'")
    expect(result.issue).toContain("-d 'www.example.com'")
    expect(result.issue).toContain('--key-type ecdsa --elliptic-curve secp256r1')
    expect(result.issue).toContain('acme-v02.api.letsencrypt.org/directory')
    expect(result.issue).not.toContain('staging')
    expect(result.nginx).toContain('/etc/letsencrypt/live/example.com/fullchain.pem')
    expect(result.nginx).toContain('/etc/letsencrypt/live/example.com/privkey.pem')
    expect(result.nginx).toContain('proxy_pass http://127.0.0.1:8080;')
    expect(result.nginx).toContain('proxy_set_header Host $host;')
    expect(result.nginx).toContain('TLSv1.2 TLSv1.3')
    expect(result.renewal).toContain('certbot.timer')
    expect(result.renewal).toContain('renew --dry-run')
    expect(result.renewal).toContain('renewal-hooks/deploy')
    expect(result.renewal).toContain('nginx -t && systemctl reload nginx')
    if(challenge==='webroot') {
      expect(result.issue).toContain("certonly --webroot -w '/var/www/letsencrypt'")
      expect(result.challenge).toContain('location ^~ /.well-known/acme-challenge/')
      expect(result.nginx).toContain('location ^~ /.well-known/acme-challenge/')
    }
    if(challenge==='cloudflare') {
      expect(result.install).toContain('python3-certbot-dns-cloudflare')
      expect(result.issue).toContain('--dns-cloudflare-credentials')
      expect(result.challenge).toContain('chmod 600')
      expect(result.challenge).not.toContain('install -d -m 700')
    }
  })
  it('quotes wildcard names and builds consistent cert-name paths', () => {
    const result = preparePublicCertificate({ ...defaults, challenge:'cloudflare', domains:'*.example.com example.com', algorithm:'rsa' })
    expect(result.issue).toContain("-d '*.example.com'")
    expect(result.issue).toContain('--rsa-key-size 2048')
    expect(result.certName).toBe('wildcard-example.com')
    expect(result.nginx).toContain('/etc/letsencrypt/live/wildcard-example.com/fullchain.pem')
  })
  it.each(['nginx','webroot'] as const)('rejects wildcard %s validation', challenge=> expect(()=>preparePublicCertificate({...defaults,challenge,domains:'*.example.com'})).toThrow('errorWildcard'))
  it('separates staging issuance from the explicit production replacement', () => {
    const result = preparePublicCertificate({...defaults,staging:true})
    expect(result.issue).toContain('acme-staging-v02')
    expect(result.productionIssue).toContain('acme-v02.api.letsencrypt.org')
    expect(result.productionIssue).not.toContain('staging')
    expect(result.productionIssue).toContain('--force-renewal')
    expect(preparePublicCertificate(defaults).productionIssue).toBe('')
  })
  it.each(['bad', 'admin@example.com;reboot','a\nb@example.com','a@-example.com','a@example..com'])('rejects malformed account email %s',email => expect(()=>preparePublicCertificate({...defaults,email})).toThrow('errorEmail'))
  it('quotes special characters in a valid email local part',()=> {
    const result=preparePublicCertificate({...defaults,email:"o'connor@example.com"})
    expect(result.issue).toContain("--email 'o'\\''connor@example.com'")
  })
  it.each(['/tmp/../token','/tmp/a b','/tmp/a;id','relative','/tmp/a\nnginx','/tmp/./token'])('rejects unsafe credential paths %s',credentials => expect(()=>preparePublicCertificate({...defaults,challenge:'cloudflare',credentials})).toThrow('errorPath'))
  it.each([0,65536,NaN,1.5])('rejects invalid upstream port %s',port => expect(()=>preparePublicCertificate({...defaults,port})).toThrow('errorPort'))
  it('requires actual agreement and rejects malformed options',()=> {
    expect(()=>preparePublicCertificate({...defaults,agreed:false})).toThrow('errorTerms')
    expect(()=>preparePublicCertificate({...defaults,challenge:'manual' as never})).toThrow('errorGeneration')
  })
})

describe('real local X.509 generation', () => {
  it.each(['ecdsa','rsa'] as const)('generates verifiable %s server certificates with matching PKCS#8 keys', async algorithm => {
    const before=Date.now()
    const result = await generateLocalCertificate({domains:'localhost example.test *.example.test',algorithm,days:7,port:3000},webcrypto as unknown as Crypto)
    const cert=new X509Certificate(result.certificate)
    const key=createPrivateKey(result.privateKey)
    expect(cert.verify(cert.publicKey)).toBe(true)
    expect(cert.checkPrivateKey(key)).toBe(true)
    expect(cert.ca).toBe(false)
    expect(cert.checkHost('localhost')).toBeTruthy()
    expect(cert.checkHost('sub.example.test')).toBeTruthy()
    expect(cert.subjectAltName).toContain('DNS:*.example.test')
    expect(cert.keyUsage).toContain('1.3.6.1.5.5.7.3.1')
    expect(cert.fingerprint256).toBe(result.fingerprint)
    expect(new Date(cert.validTo).getTime()).toBeGreaterThanOrEqual(before+7*86400000-1000)
    expect(new Date(cert.validFrom).getTime()).toBeLessThan(before)
    expect(key.asymmetricKeyType).toBe(algorithm==='rsa'?'rsa':'ec')
    expect(result.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
    expect(result.nginx).toContain('proxy_pass http://127.0.0.1:3000;')
    const signature=sign('sha256',Buffer.from('independent key verification'),key)
    expect(verify('sha256',Buffer.from('independent key verification'),createPublicKey(key),signature)).toBe(true)
    const zip=await JSZip.loadAsync(await (await certificateBundle(result)).arrayBuffer())
    expect(Object.keys(zip.files).sort()).toEqual(['fullchain.pem','nginx.conf','privkey.pem'])
    expect(await zip.file('privkey.pem')!.async('string')).toBe(result.privateKey)
    expect(zip.file('privkey.pem')!.unixPermissions).toBe(0o600)
    expect(await zip.file('fullchain.pem')!.async('string')).toBe(result.certificate)
  },15000)
  it('generates fresh keys and serials for each certificate',async()=> {
    const options={domains:'localhost',algorithm:'ecdsa' as const,days:1,port:8080}
    const [a,b]=await Promise.all([generateLocalCertificate(options,webcrypto as unknown as Crypto),generateLocalCertificate(options,webcrypto as unknown as Crypto)])
    expect(a.privateKey).not.toBe(b.privateKey)
    expect(new X509Certificate(a.certificate).serialNumber).not.toBe(new X509Certificate(b.certificate).serialNumber)
  })
  it.each([0,366,1.5,NaN])('rejects invalid validity %s',async days=>await expect(generateLocalCertificate({domains:'localhost',algorithm:'ecdsa',days,port:8080},webcrypto as unknown as Crypto)).rejects.toThrow('errorDays'))
  it('reports missing secure Web Crypto',async()=> await expect(generateLocalCertificate({domains:'localhost',algorithm:'ecdsa',days:1,port:8080},{} as Crypto)).rejects.toThrow('errorCrypto'))
})
