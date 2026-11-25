import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, LockKeyhole } from 'lucide-react'
import { useTranslations } from '@/i18n/compat'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Workbench, Field, Panel, ErrorMessage, Output, downloadText } from '@/components/tools/workbench'
import { CertificateToolError, preparePublicCertificate, generateLocalCertificate, certificateBundle, type CertificateAlgorithm, type CertificateChallenge, type PublicCertificateSetup, type LocalCertificate } from '@/lib/nginx-certificate'

const selectClass = 'h-10 w-full rounded-md border bg-background px-3 text-sm'
export default function NginxCertificateGeneratorPage() {
  const t = useTranslations('tools.nginx-certificate-generator')
  const w = useTranslations('workbench')
  const [mode, setMode] = useState<'public' | 'local'>('public')
  const [domains, setDomains] = useState('example.com\nwww.example.com')
  const [email, setEmail] = useState('')
  const [algorithm, setAlgorithm] = useState<CertificateAlgorithm>('ecdsa')
  const [challenge, setChallenge] = useState<CertificateChallenge>('nginx')
  const [webroot, setWebroot] = useState('/var/www/letsencrypt')
  const [credentials, setCredentials] = useState('/etc/letsencrypt/cloudflare.ini')
  const [port, setPort] = useState('8080')
  const [days, setDays] = useState('30')
  const [staging, setStaging] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [setup, setSetup] = useState<PublicCertificateSetup | null>(null)
  const [local, setLocal] = useState<LocalCertificate | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)
  useEffect(() => () => { revision.current++ }, [])
  const reset = () => { revision.current++; setSetup(null); setLocal(null); setError(''); setBusy(false) }
  const message = (cause: unknown) => cause instanceof CertificateToolError ? t(cause.code) : t('errorGeneration')
  const generate = async () => {
    reset()
    const ticket = revision.current
    try {
      if (mode === 'public') {
        setSetup(preparePublicCertificate({ domains, email, algorithm, challenge, webroot, credentials, port: Number(port), staging, agreed }))
      } else {
        setBusy(true)
        const result = await generateLocalCertificate({ domains, algorithm, port: Number(port), days: Number(days) })
        if (ticket === revision.current) setLocal(result)
      }
    } catch (cause) { if (ticket === revision.current) setError(message(cause)) }
    finally { if (ticket === revision.current) setBusy(false) }
  }
  const downloadBundle = async () => {
    if (!local) return
    const ticket = revision.current
    setError('')
    try {
      const blob = await certificateBundle(local)
      if (ticket !== revision.current) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = 'nginx-certificate.zip'
      document.body.appendChild(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) { if (ticket === revision.current) setError(message(cause)) }
  }
  const changeMode = (next: 'public' | 'local') => { reset(); setMode(next); setAgreed(false) }
  return <Workbench toolId="nginx-certificate-generator">
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('name')}>
      <Button data-testid="cert-public-mode" aria-pressed={mode === 'public'} variant={mode === 'public' ? 'default' : 'outline'} onClick={() => changeMode('public')}><ShieldCheck className="me-2 size-4" />{t('publicMode')}</Button>
      <Button data-testid="cert-local-mode" aria-pressed={mode === 'local'} variant={mode === 'local' ? 'default' : 'outline'} onClick={() => changeMode('local')}><LockKeyhole className="me-2 size-4" />{t('localMode')}</Button>
    </div>
    <p data-testid="cert-notice" className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">{t(mode === 'public' ? 'publicNotice' : 'localNotice')}</p>
    <Panel title={w('input')}>
      <Field label={t('domains')} htmlFor="cert-domains" hint={t(mode === 'public' ? 'domainsHint' : 'localDomainsHint')}><Textarea id="cert-domains" data-testid="cert-domains" maxLength={6000} dir="ltr" spellCheck={false} className="min-h-24 font-mono" value={domains} onChange={event => { reset(); setDomains(event.target.value) }} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('algorithm')} htmlFor="cert-algorithm"><select id="cert-algorithm" data-testid="cert-algorithm" className={selectClass} value={algorithm} onChange={event => { reset(); setAlgorithm(event.target.value as CertificateAlgorithm) }}><option value="ecdsa">{t('ecdsa')}</option><option value="rsa">{t('rsa')}</option></select></Field>
        <Field label={t('upstream')} htmlFor="cert-port"><Input id="cert-port" data-testid="cert-port" type="number" min={1} max={65535} value={port} onChange={event => { reset(); setPort(event.target.value) }} /></Field>
      </div>
      {mode === 'public' ? <>
        <Field label={t('email')} htmlFor="cert-email" hint={t('emailHint')}><Input id="cert-email" data-testid="cert-email" type="email" autoComplete="off" maxLength={254} dir="ltr" placeholder="admin@example.com" value={email} onChange={event => { reset(); setEmail(event.target.value); setAgreed(false) }} /></Field>
        <Field label={t('challenge')} htmlFor="cert-challenge" hint={t(challenge === 'cloudflare' ? 'dnsHint' : 'httpHint')}><select id="cert-challenge" data-testid="cert-challenge" className={selectClass} value={challenge} onChange={event => { reset(); setChallenge(event.target.value as CertificateChallenge) }}><option value="nginx">{t('nginxChallenge')}</option><option value="webroot">{t('webrootChallenge')}</option><option value="cloudflare">{t('dnsChallenge')}</option></select></Field>
        {challenge === 'webroot' && <Field label={t('webroot')} htmlFor="cert-webroot"><Input id="cert-webroot" data-testid="cert-webroot" dir="ltr" value={webroot} onChange={event => { reset(); setWebroot(event.target.value) }} /></Field>}
        {challenge === 'cloudflare' && <Field label={t('credentials')} htmlFor="cert-credentials"><Input id="cert-credentials" data-testid="cert-credentials" dir="ltr" value={credentials} onChange={event => { reset(); setCredentials(event.target.value) }} /></Field>}
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" data-testid="cert-staging" checked={staging} onChange={event => { reset(); setStaging(event.target.checked) }} className="mt-1" /><span>{t('staging')}</span></label>
        {staging && <p data-testid="cert-staging-notice" className="text-sm text-amber-700 dark:text-amber-300">{t('stagingNotice')}</p>}
        <div className="space-y-2"><label className="flex items-start gap-3 text-sm"><input type="checkbox" data-testid="cert-terms" checked={agreed} onChange={event => { reset(); setAgreed(event.target.checked) }} className="mt-1" /><span>{t('terms')}</span></label><a href="https://letsencrypt.org/repository/" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline underline-offset-4">{t('termsLink')}</a></div>
        <p className="text-xs text-muted-foreground">{t('platform')}</p>
      </> : <Field label={t('days')} htmlFor="cert-days"><Input id="cert-days" data-testid="cert-days" type="number" min={1} max={365} value={days} onChange={event => { reset(); setDays(event.target.value) }} /></Field>}
      <ErrorMessage>{error}</ErrorMessage>
      <div className="flex flex-wrap gap-2"><Button data-testid="cert-generate" disabled={busy} onClick={() => void generate()}>{busy ? t('generating') : t(mode === 'public' ? 'generatePublic' : 'generateLocal')}</Button><Button data-testid="cert-clear" variant="outline" onClick={() => { reset(); setDomains(''); setEmail(''); setAgreed(false) }}>{w('clear')}</Button><Link href="/tools/certificate-parser" className="self-center px-2 text-sm text-primary underline underline-offset-4">{t('parserLink')}</Link></div>
    </Panel>
    {setup && <div data-testid="cert-public-result" className="space-y-5">
      <Panel title={t('stepInstall')}><p className="text-sm text-muted-foreground">{t('installHint')}</p><Output label={t('stepInstall')} value={setup.install} filename="install-certbot.sh" /></Panel>
      {setup.challenge && <Panel title={t('stepChallenge')}><p className="text-sm text-muted-foreground">{t(challenge === 'cloudflare' ? 'dnsSetupHint' : 'challengeHint')}</p><div data-testid="cert-challenge-output"><Output label={t('stepChallenge')} value={setup.challenge} filename="challenge-setup.txt" /></div></Panel>}
      <Panel title={t('stepIssue')}><div data-testid="cert-issue-output"><Output label={t('stepIssue')} value={setup.issue} filename="request-certificate.sh" /></div>{setup.productionIssue && <><p className="text-sm text-amber-700 dark:text-amber-300">{t('stagingNotice')}</p><div data-testid="cert-production-output"><Output label={t('generatePublic')} value={setup.productionIssue} filename="replace-staging-certificate.sh" /></div></>}</Panel>
      <Panel title={t('stepNginx')}><p className="text-sm text-muted-foreground">{t('deployHint')}</p><div data-testid="cert-nginx-output"><Output label={t('stepNginx')} value={setup.nginx} filename="nginx.conf" /></div></Panel>
      <Panel title={t('stepRenew')}><p className="text-sm text-muted-foreground">{t('renewHint')}</p><div data-testid="cert-renew-output"><Output label={t('stepRenew')} value={setup.renewal} filename="setup-renewal.sh" /></div></Panel>
    </div>}
    {local && <div data-testid="cert-local-result"><Panel title={t('localResult')}><dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">{t('domains')}</dt><dd className="break-words font-mono" dir="ltr">{local.domains.join(', ')}</dd></div><div><dt className="text-muted-foreground">{t('expires')}</dt><dd data-testid="cert-expires" dir="ltr">{local.expires}</dd></div><div><dt className="text-muted-foreground">{t('fingerprint')}</dt><dd data-testid="cert-fingerprint" className="break-all font-mono" dir="ltr">{local.fingerprint}</dd></div></dl><p className="text-sm text-muted-foreground">{t('bundleHint')}</p><div className="flex flex-wrap gap-2"><Button data-testid="cert-download-bundle" onClick={() => void downloadBundle()}>{t('downloadBundle')}</Button><Button data-testid="cert-download-cert" variant="outline" onClick={() => downloadText(local.certificate, 'fullchain.pem', 'application/x-pem-file')}>{t('downloadCert')}</Button><Button data-testid="cert-download-key" variant="outline" onClick={() => downloadText(local.privateKey, 'privkey.pem', 'application/x-pem-file')}>{t('downloadKey')}</Button></div><div data-testid="cert-local-nginx"><Output label={t('stepNginx')} value={local.nginx} filename="nginx.conf" /></div></Panel></div>}
  </Workbench>
}
