import { beforeEach, describe, expect, it, vi } from 'vitest'

const success = {
  query: '8.8.8.8',
  status: 'success' as const,
  country: 'United States',
  countryCode: 'US',
  lat: 0,
  lon: 0,
}

async function loadApi() {
  vi.resetModules()
  return import('../ip-api')
}

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Service Unavailable',
    json: async () => body,
  } as Response
}

describe('IP API service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('rejects invalid IPs without making a network request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadApi()
    await expect(api.getIPInfo('999.1.1.1')).rejects.toMatchObject({ code: 'INVALID_IP' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requests valid IP data and reuses cached responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(success))
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadApi()
    const first = await api.getIPInfo('8.8.8.8')
    const second = await api.getIPInfo('8.8.8.8')
    expect(first).toEqual(success)
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/8.8.8.8?')
  })

  it('translates HTTP, API, and network errors to typed errors', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadApi()

    fetchMock.mockResolvedValueOnce(response({}, false, 503))
    await expect(api.getIPInfo('8.8.4.4')).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 503 })

    fetchMock.mockResolvedValueOnce(response({ status: 'fail', message: 'reserved range' }))
    await expect(api.getIPInfo('1.1.1.1')).rejects.toMatchObject({ code: 'API_ERROR' })

    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'))
    await expect(api.getIPInfo('9.9.9.9')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('enforces the request limit and expires old requests from its window', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(response(success))
    vi.stubGlobal('fetch', fetchMock)
    const api = await loadApi()

    for (let index = 1; index <= 45; index += 1) {
      await api.getIPInfo(`8.8.${Math.floor(index / 256)}.${index}`)
    }
    expect(api.getAPIStatus()).toMatchObject({ requestCount: 45, rateLimit: 45, canMakeRequest: false })
    await expect(api.getIPInfo('8.8.1.45')).rejects.toMatchObject({ code: 'RATE_LIMITED' })

    await vi.advanceTimersByTimeAsync(60_001)
    expect(api.getAPIStatus()).toMatchObject({ requestCount: 0, canMakeRequest: true })
    await api.getIPInfo('8.8.1.45')
    expect(fetchMock).toHaveBeenCalledTimes(46)
  })

  it('formats text fields and includes enabled flags', async () => {
    const api = await loadApi()
    expect(api.formatIPInfoText({
      ...success,
      city: 'Example City',
      timezone: 'Etc/UTC',
      isp: 'Example ISP',
      proxy: true,
      mobile: true,
    })).toContain('Example City')
    expect(api.formatIPInfoText({ ...success, proxy: true })).toContain('0, 0')
  })
})
