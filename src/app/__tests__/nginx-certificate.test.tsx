import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/compat'
import * as certificates from '@/lib/nginx-certificate'
import Page from '../[locale]/tools/nginx-certificate-generator/page'

const mount = () => render(<BrowserRouter><LocaleProvider locale="en"><Page /></LocaleProvider></BrowserRouter>)
const fill = (id: string,value: string) => fireEvent.change(screen.getByTestId(id),{target:{value}})
const run = () => fireEvent.click(screen.getByTestId('cert-generate'))
const result: certificates.LocalCertificate = { certificate:'PUBLIC CERTIFICATE',privateKey:'PRIVATE-KEY-MUST-NOT-APPEAR',fingerprint:'AA:BB',expires:'2026-12-25T00:00:00.000Z',nginx:'server { listen 443 ssl; }',domains:['localhost'] }
afterEach(()=> { cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear() })

describe('Nginx certificate workflows',()=> {
  it('prepares public issuance only after valid input and agreement, and clears stale results',()=> {
    mount()
    fill('cert-email','admin@example.com')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent('Subscriber Agreement')
    fireEvent.click(screen.getByTestId('cert-terms'))
    run()
    expect(screen.getByTestId('cert-public-result')).toBeInTheDocument()
    expect((screen.getByTestId('cert-issue-output').querySelector('textarea') as HTMLTextAreaElement).value).toContain('sudo certbot --nginx --redirect')
    fill('cert-port','3000')
    expect(screen.queryByTestId('cert-public-result')).toBeNull()
    run()
    expect((screen.getByTestId('cert-nginx-output').querySelector('textarea') as HTMLTextAreaElement).value).toContain('127.0.0.1:3000')
    fireEvent.click(screen.getByTestId('cert-clear'))
    expect(screen.getByTestId('cert-domains')).toHaveValue('')
    expect(screen.getByTestId('cert-terms')).not.toBeChecked()
    expect(screen.queryByTestId('cert-public-result')).toBeNull()
  })
  it('handles wildcards, Webroot and staging without mixing trusted and test results',()=> {
    mount();fill('cert-email','admin@example.com');fireEvent.click(screen.getByTestId('cert-terms'))
    fill('cert-domains','*.example.com example.com');run()
    expect(screen.getByRole('alert')).toHaveTextContent('DNS validation')
    fill('cert-challenge','cloudflare');fireEvent.click(screen.getByTestId('cert-staging'));run()
    expect((screen.getByTestId('cert-issue-output').querySelector('textarea') as HTMLTextAreaElement).value).toContain('acme-staging-v02')
    expect((screen.getByTestId('cert-production-output').querySelector('textarea') as HTMLTextAreaElement).value).toContain('--force-renewal')
    fill('cert-domains','example.com');fill('cert-challenge','webroot');run()
    expect((screen.getByTestId('cert-challenge-output').querySelector('textarea') as HTMLTextAreaElement).value).toContain('/.well-known/acme-challenge/')
  })
  it('rejects invalid local inputs without starting key generation',async()=> {
    const generate=vi.spyOn(certificates,'generateLocalCertificate').mockRejectedValue(new certificates.CertificateToolError('errorDays'))
    mount();fireEvent.click(screen.getByTestId('cert-local-mode'));fill('cert-days','0');run()
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('1 to 365'))
    expect(generate).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('cert-local-result')).toBeNull()
    expect(screen.getByTestId('cert-notice')).toHaveTextContent('not trust them by default')
  })
  it('generates local downloads without displaying or persisting a private key',async()=> {
    vi.spyOn(certificates,'generateLocalCertificate').mockResolvedValue(result)
    const fetchSpy=vi.spyOn(globalThis,'fetch')
    const store=vi.spyOn(Storage.prototype,'setItem')
    mount();fireEvent.click(screen.getByTestId('cert-local-mode'));fill('cert-domains','localhost');run()
    await waitFor(()=>expect(screen.getByTestId('cert-local-result')).toBeInTheDocument())
    expect(screen.getByTestId('cert-fingerprint')).toHaveTextContent('AA:BB')
    expect(screen.getByTestId('cert-download-key')).toBeEnabled()
    expect(document.body).not.toHaveTextContent(result.privateKey)
    expect(store).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('cert-public-mode'))
    expect(screen.queryByTestId('cert-local-result')).toBeNull()
    expect(screen.getByTestId('cert-notice')).toHaveTextContent('does not issue a public certificate here')
  })
  it.each(['clear','edit','mode'])('discards an old async key result after %s',async action=> {
    let complete!:(value:certificates.LocalCertificate)=>void
    vi.spyOn(certificates,'generateLocalCertificate').mockImplementation(()=>new Promise(resolve=> {complete=resolve}))
    mount();fireEvent.click(screen.getByTestId('cert-local-mode'));run()
    expect(screen.getByTestId('cert-generate')).toBeDisabled()
    if(action==='clear') fireEvent.click(screen.getByTestId('cert-clear'))
    else if(action==='edit') fill('cert-domains','new.example.test')
    else fireEvent.click(screen.getByTestId('cert-public-mode'))
    await act(async()=>complete(result))
    expect(screen.queryByTestId('cert-local-result')).toBeNull()
    expect(screen.getByTestId('cert-generate')).toBeEnabled()
  })
})
