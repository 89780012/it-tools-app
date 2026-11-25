import { afterEach, describe, expect, it } from 'vitest'
import { applySeoHead, getSeoHead } from '../metadata'
import en from '@/i18n/messages/en.json'

const t = (key: string): string => key.split('.').reduce<unknown>((value, name) => (value as Record<string, unknown>)[name], en) as string

afterEach(() => { document.head.innerHTML = '' })

describe('SEO after client navigation', () => {
  it('replaces prerendered tags and leaves one canonical across repeated updates', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://www.toolkitpub.com"><link rel="alternate" hreflang="en" href="https://www.toolkitpub.com"><meta name="description" content="old">'
    applySeoHead(getSeoHead('en', 'home', undefined, t), 'en')
    const tool = getSeoHead('en', 'tools', 'json-formatter', t)
    applySeoHead(tool, 'en')
    applySeoHead(tool, 'en')
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://www.toolkitpub.com/tools/json-formatter')
    expect(document.querySelectorAll('link[rel="alternate"]')).toHaveLength(12)
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(document.querySelector('meta[property="og:image"]')).toBeNull()
    expect(document.title).toBe(`${en.tools['json-formatter'].meta.title} - IT Tools Collection`)
  })

  it('restores homepage metadata when leaving a tool', () => {
    applySeoHead(getSeoHead('en', 'tools', 'json-formatter', t), 'en')
    applySeoHead(getSeoHead('zh', 'home', undefined, t), 'zh')
    expect(document.querySelectorAll('link[rel="alternate"]')).toHaveLength(4)
    expect(document.querySelectorAll('meta[property="og:image"]')).toHaveLength(2)
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('zh_CN')
    expect(document.documentElement.lang).toBe('zh')
    expect(document.title).toBe('IT Tools Collection - Developer Toolbox')
  })

  it('keeps upstream changelog and Linux log helper inheritance', () => {
    applySeoHead(getSeoHead('en', 'changelog', undefined, t), 'en')
    expect(document.title).toBe(`${en.changelog.meta.title} - IT Tools Collection`)
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(en.changelog.meta.description)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://www.toolkitpub.com')
    applySeoHead(getSeoHead('en', 'tools', 'linux-log-helper', t), 'en')
    expect(document.querySelectorAll('link[rel="alternate"]')).toHaveLength(4)
    expect(document.querySelector('meta[property="og:url"]')).toBeNull()
  })
})
