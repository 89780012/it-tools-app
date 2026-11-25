export type CertificateAlgorithm = 'rsa' | 'ecdsa'
export type CertificateChallenge = 'nginx' | 'webroot' | 'cloudflare'
export class CertificateToolError extends Error {
  constructor(public code: string) { super(code) }
}
const fail = (code: string): never => { throw new CertificateToolError(code) }

export function certificateDomains(input: string, local = false): string[] {
  if (input.length > 6000) return fail('errorDomains')
  const names = input.trim().split(/[\s,]+/u).filter(Boolean)
  if (!names.length || names.length > 100) return fail('errorDomains')
  const normalized = names.map(raw => {
    if (!/^[\p{L}\p{N}.*-]+$/u.test(raw)) return fail('errorDomains')
    const wildcard = raw.startsWith('*.')
    const candidate = (wildcard ? raw.slice(2) : raw).replace(/\.$/, '')
    let host: string
    try { host = new URL(`http://${candidate}`).hostname.toLowerCase() } catch { return fail('errorDomains') }
    const labels = host.split('.')
    if (host.length > 253 || !host || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) || /^\d+$/.test(labels.at(-1)!)) return fail('errorDomains')
    if ((!local && (labels.length < 2 || ['localhost', 'local', 'test', 'invalid', 'example', 'internal'].includes(labels.at(-1)!))) || (wildcard && labels.length < 2)) return fail('errorDomains')
    return wildcard ? `*.${host}` : host
  })
  const domains = [...new Set(normalized)]
  if (domains.length > 20) return fail('errorDomains')
  return domains
}
function linuxPath(value: string): string {
  if (!/^\/[A-Za-z0-9_./-]+$/.test(value) || value.length > 240 || value.split('/').some(segment => segment === '..' || segment === '.') || value.endsWith('/') || value.includes('//')) return fail('errorPath')
  return value
}
export function applicationPort(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 65535) return fail('errorPort')
  return value
}
const shell = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
const ACME_PRODUCTION = 'https://acme-v02.api.letsencrypt.org/directory'
const ACME_STAGING = 'https://acme-staging-v02.api.letsencrypt.org/directory'

export interface PublicCertificateOptions {
  domains: string
  email: string
  algorithm: CertificateAlgorithm
  challenge: CertificateChallenge
  webroot: string
  credentials: string
  port: number
  staging: boolean
  agreed: boolean
}
export interface PublicCertificateSetup {
  domains: string[]
  certName: string
  install: string
  challenge: string
  issue: string
  productionIssue: string
  nginx: string
  renewal: string
}
function proxyBlock(port: number) {
  return `    location / {\n        proxy_pass http://127.0.0.1:${port};\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }`
}
function challengeLocation(webroot: string) {
  return `    location ^~ /.well-known/acme-challenge/ {\n        root ${webroot};\n        default_type text/plain;\n        try_files $uri =404;\n    }`
}
export function certificateNginx(domains: string[], port: number, certificate: string, key: string, webroot?: string): string {
  applicationPort(port)
  const servers = domains.join(' ')
  return `server {\n    listen 80;\n    listen [::]:80;\n    server_name ${servers};\n${webroot ? `${challengeLocation(webroot)}\n` : ''}    location / {\n        return 301 https://$host$request_uri;\n    }\n}\n\nserver {\n    listen 443 ssl;\n    listen [::]:443 ssl;\n    server_name ${servers};\n    ssl_certificate ${certificate};\n    ssl_certificate_key ${key};\n    ssl_protocols TLSv1.2 TLSv1.3;\n    ssl_session_cache shared:TLS:10m;\n    ssl_session_timeout 1d;\n\n${proxyBlock(port)}\n}\n`
}
export function preparePublicCertificate(options: PublicCertificateOptions): PublicCertificateSetup {
  const domains = certificateDomains(options.domains)
  if (!['rsa', 'ecdsa'].includes(options.algorithm) || !['nginx', 'webroot', 'cloudflare'].includes(options.challenge)) return fail('errorGeneration')
  if (domains.some(domain => domain.startsWith('*.')) && options.challenge !== 'cloudflare') return fail('errorWildcard')
  const email = options.email.trim()
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(email) || email.length > 254 || email.startsWith('.') || email.split('@')[0].endsWith('.') || email.includes('..')) return fail('errorEmail')
  if (!options.agreed) return fail('errorTerms')
  applicationPort(options.port)
  const webroot = options.challenge === 'webroot' ? linuxPath(options.webroot) : undefined
  const credentials = options.challenge === 'cloudflare' ? linuxPath(options.credentials) : undefined
  const certName = domains[0].replace('*.', 'wildcard-')
  const plugin = options.challenge === 'nginx' ? 'python3-certbot-nginx' : options.challenge === 'cloudflare' ? 'python3-certbot-dns-cloudflare' : ''
  const install = `sudo apt-get update\nsudo apt-get install -y certbot${plugin ? ` ${plugin}` : ''}`
  const challenge = webroot
    ? `sudo mkdir -p ${shell(webroot)}\n\nserver {\n    listen 80;\n    listen [::]:80;\n    server_name ${domains.join(' ')};\n${challengeLocation(webroot)}\n${proxyBlock(options.port)}\n}\n`
    : credentials
      ? `sudo mkdir -p ${shell(credentials.slice(0, credentials.lastIndexOf('/')) || '/')}\nsudo touch ${shell(credentials)}\nsudo chmod 600 ${shell(credentials)}\nsudoedit ${shell(credentials)}\n\n# ${credentials}\ndns_cloudflare_api_token = REPLACE_WITH_ZONE_SCOPED_TOKEN`
      : ''
  const flags = [
    options.challenge === 'nginx' ? '--nginx --redirect' : options.challenge === 'webroot' ? `certonly --webroot -w ${shell(webroot!)}` : `certonly --dns-cloudflare --dns-cloudflare-credentials ${shell(credentials!)} --dns-cloudflare-propagation-seconds 60`,
    `--cert-name ${shell(certName)}`,
    ...domains.map(domain => `-d ${shell(domain)}`),
    `--email ${shell(email)}`,
    '--agree-tos --non-interactive',
    options.algorithm === 'rsa' ? '--key-type rsa --rsa-key-size 2048' : '--key-type ecdsa --elliptic-curve secp256r1',
  ]
  const command = (server: string, force = false) => `sudo certbot ${flags.join(' \\\n  ')} \\\n  --server ${shell(server)}${force ? ' --force-renewal' : ''}`
  const hook = '#!/bin/sh\nset -eu\nnginx -t && systemctl reload nginx\n'
  const renewal = `sudo install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy\nprintf '%s' ${shell(hook)} | sudo tee /etc/letsencrypt/renewal-hooks/deploy/20-nginx-reload >/dev/null\nsudo chmod 755 /etc/letsencrypt/renewal-hooks/deploy/20-nginx-reload\nsudo systemctl enable --now certbot.timer\nsudo systemctl list-timers --all certbot.timer\nsudo certbot renew --dry-run`
  return {
    domains, certName, install, challenge,
    issue: command(options.staging ? ACME_STAGING : ACME_PRODUCTION),
    productionIssue: options.staging ? command(ACME_PRODUCTION, true) : '',
    nginx: certificateNginx(domains, options.port, `/etc/letsencrypt/live/${certName}/fullchain.pem`, `/etc/letsencrypt/live/${certName}/privkey.pem`, webroot),
    renewal,
  }
}

export interface LocalCertificateOptions { domains: string; algorithm: CertificateAlgorithm; days: number; port: number }
export interface LocalCertificate { certificate: string; privateKey: string; fingerprint: string; expires: string; nginx: string; domains: string[] }
export async function generateLocalCertificate(options: LocalCertificateOptions, cryptoApi: Crypto = globalThis.crypto): Promise<LocalCertificate> {
  const domains = certificateDomains(options.domains, true)
  applicationPort(options.port)
  if (!Number.isInteger(options.days) || options.days < 1 || options.days > 365) return fail('errorDays')
  if (!['rsa', 'ecdsa'].includes(options.algorithm)) return fail('errorGeneration')
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) return fail('errorCrypto')
  try {
    await import('reflect-metadata')
    const { X509CertificateGenerator, SubjectAlternativeNameExtension, BasicConstraintsExtension, KeyUsagesExtension, KeyUsageFlags, ExtendedKeyUsageExtension, ExtendedKeyUsage } = await import('@peculiar/x509')
    const algorithm = options.algorithm === 'rsa'
      ? { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
      : { name: 'ECDSA', namedCurve: 'P-256' }
    const keys = await cryptoApi.subtle.generateKey(algorithm, true, ['sign', 'verify']) as CryptoKeyPair
    const serialBytes = cryptoApi.getRandomValues(new Uint8Array(16))
    serialBytes[0] = (serialBytes[0] & 0x7f) | 1
    const now = Date.now()
    const cert = await X509CertificateGenerator.createSelfSigned({
      name: `CN=${domains[0].length <= 64 ? domains[0] : 'Local development certificate'}`,
      serialNumber: Array.from(serialBytes, byte => byte.toString(16).padStart(2, '0')).join(''),
      keys,
      notBefore: new Date(now - 300000),
      notAfter: new Date(now + options.days * 86400000),
      signingAlgorithm: options.algorithm === 'rsa' ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as RsaHashedImportParams : { name: 'ECDSA', hash: 'SHA-256' },
      extensions: [
        new BasicConstraintsExtension(false, undefined, true),
        new SubjectAlternativeNameExtension(domains.map(value => ({ type: 'dns' as const, value }))),
        new KeyUsagesExtension(KeyUsageFlags.digitalSignature | (options.algorithm === 'rsa' ? KeyUsageFlags.keyEncipherment : 0), true),
        new ExtendedKeyUsageExtension([ExtendedKeyUsage.serverAuth]),
      ],
    }, cryptoApi)
    const pkcs8 = new Uint8Array(await cryptoApi.subtle.exportKey('pkcs8', keys.privateKey))
    const encoded = btoa(Array.from(pkcs8, byte => String.fromCharCode(byte)).join(''))
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${encoded.match(/.{1,64}/g)!.join('\n')}\n-----END PRIVATE KEY-----\n`
    const fingerprint = Array.from(new Uint8Array(await cert.getThumbprint('SHA-256', cryptoApi)), byte => byte.toString(16).padStart(2, '0')).join(':').toUpperCase()
    return {
      certificate: `${cert.toString('pem')}\n`, privateKey, domains, fingerprint, expires: cert.notAfter.toISOString(),
      nginx: certificateNginx(domains, options.port, '/etc/nginx/ssl/local-test/fullchain.pem', '/etc/nginx/ssl/local-test/privkey.pem'),
    }
  } catch (error) { if (error instanceof CertificateToolError) throw error; return fail('errorGeneration') }
}

export async function certificateBundle(result: LocalCertificate): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file('fullchain.pem', result.certificate, { unixPermissions: 0o644 })
  zip.file('privkey.pem', result.privateKey, { unixPermissions: 0o600 })
  zip.file('nginx.conf', result.nginx, { unixPermissions: 0o644 })
  return zip.generateAsync({ type: 'blob', platform: 'UNIX' })
}
