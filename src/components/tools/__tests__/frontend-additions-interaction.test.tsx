import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { LocaleProvider } from '@/i18n/compat'
import additions from '@/i18n/messages/frontend-additions/en.json'
import MarkdownPreview from '@/app/[locale]/tools/markdown-preview/page'
import CssFormatter from '@/app/[locale]/tools/css-formatter/page'
import ColorContrastChecker from '@/app/[locale]/tools/color-contrast-checker/page'
import ImageCompressor from '@/app/[locale]/tools/image-compressor/page'
import * as image from '@/lib/frontend-image'

const messages = {
  ...additions,
  workbench: {
    input: 'Input',
    output: 'Output',
    format: 'Format',
    clear: 'Clear',
    local: 'Local',
    download: 'Download',
    copy: 'Copy',
  },
}
const mount = (Page: React.ComponentType) =>
  render(
    <MemoryRouter><LocaleProvider locale="en" initialMessages={messages}>
      <Page />
    </LocaleProvider></MemoryRouter>,
  )
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe('frontend tools interactions', () => {
  it('updates sanitized Markdown live and inserts editable tables', () => {
    mount(MarkdownPreview)
    fireEvent.change(screen.getByTestId('markdown-input'), {
      target: {
        value:
          '# Hello\n<script>window.bad=1</script><a href="javascript:alert(1)">bad</a>',
      },
    })
    expect(
      screen.getByTestId('markdown-preview').querySelector('h1'),
    ).toHaveTextContent('Hello')
    expect(
      screen
        .getByTestId('markdown-preview')
        .querySelector('script,[href^="javascript:"]'),
    ).toBeNull()
    fireEvent.change(screen.getByTestId('markdown-cell-0-0'), {
      target: { value: 'a|b' },
    })
    fireEvent.change(screen.getByTestId('markdown-rows'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByTestId('markdown-insert-table'))
    expect(
      (screen.getByTestId('markdown-input') as HTMLTextAreaElement).value,
    ).toContain('a\\|b')
    expect(
      screen.getByTestId('markdown-preview').querySelector('th'),
    ).toHaveTextContent('a|b')
  })
  it('formats CSS with indentation and clears output on a syntax error', async () => {
    mount(CssFormatter)
    fireEvent.change(screen.getByTestId('css-input'), {
      target: { value: 'a{color:red}' },
    })
    fireEvent.change(screen.getByTestId('css-indent'), {
      target: { value: '4' },
    })
    fireEvent.click(screen.getByTestId('css-format'))
    await waitFor(() =>
      expect(screen.getByTestId('tool-output')).toHaveValue(
        'a {\n    color: red;\n}\n',
      ),
    )
    fireEvent.change(screen.getByTestId('css-input'), {
      target: { value: 'a { color: red;' },
    })
    fireEvent.click(screen.getByTestId('css-format'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid CSS'),
    )
    expect(screen.getByTestId('tool-output')).toHaveValue('')
  })
  it('synchronizes HEX and color inputs, swaps and handles invalid colors', () => {
    mount(ColorContrastChecker)
    expect(screen.getByTestId('contrast-ratio')).toHaveTextContent('21.00:1')
    fireEvent.change(screen.getByTestId('contrast-foreground'), {
      target: { value: '#777' },
    })
    expect(screen.getByTestId('contrast-foreground-picker')).toHaveValue(
      '#777777',
    )
    expect(screen.getByTestId('contrast-aaNormal')).toHaveTextContent('Fail')
    fireEvent.change(screen.getByTestId('contrast-foreground-picker'), {
      target: { value: '#123456' },
    })
    expect(screen.getByTestId('contrast-foreground')).toHaveValue('#123456')
    fireEvent.click(screen.getByTestId('contrast-swap'))
    expect(screen.getByTestId('contrast-background')).toHaveValue('#123456')
    fireEvent.change(screen.getByTestId('contrast-background'), {
      target: { value: '#invalid' },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('valid')
    expect(screen.queryByTestId('contrast-ratio')).toBeNull()
  })
  it('ignores stale uploads and encoding results and revokes owned URLs', async () => {
    const revoke = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:result'),
      revokeObjectURL: revoke,
    })
    let finishFirst!: (
      value: Awaited<ReturnType<typeof image.frontendLoadImage>>,
    ) => void
    let finishEncode!: (value: Blob) => void
    const first = new Promise<
      Awaited<ReturnType<typeof image.frontendLoadImage>>
    >((resolve) => {
      finishFirst = resolve
    })
    const second = {
      image: { naturalWidth: 200, naturalHeight: 100 } as HTMLImageElement,
      url: 'blob:second',
    }
    vi.spyOn(image, 'frontendLoadImage')
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(second)
    vi.spyOn(image, 'frontendEncodeImage').mockImplementation(
      () =>
        new Promise((resolve) => {
          finishEncode = resolve
        }),
    )
    const view = mount(ImageCompressor)
    const file = new File(['png'], 'test.png', { type: 'image/png' })
    fireEvent.change(screen.getByTestId('image-upload'), {
      target: { files: [file] },
    })
    fireEvent.change(screen.getByTestId('image-upload'), {
      target: { files: [file] },
    })
    await waitFor(() =>
      expect(screen.getByTestId('image-width')).toHaveValue(200),
    )
    await act(async () =>
      finishFirst({
        image: { naturalWidth: 1, naturalHeight: 1 } as HTMLImageElement,
        url: 'blob:first',
      }),
    )
    expect(screen.getByTestId('image-width')).toHaveValue(200)
    expect(revoke).toHaveBeenCalledWith('blob:first')
    fireEvent.change(screen.getByTestId('image-width'), {
      target: { value: '100' },
    })
    expect(screen.getByTestId('image-height')).toHaveValue(50)
    fireEvent.click(screen.getByTestId('image-compress'))
    fireEvent.change(screen.getByTestId('image-width'), {
      target: { value: '50' },
    })
    await act(async () =>
      finishEncode(new Blob(['result'], { type: 'image/png' })),
    )
    expect(screen.queryByTestId('image-result')).toBeNull()
    view.unmount()
    expect(revoke).toHaveBeenCalledWith('blob:second')
  })
  it('server renders every tool without requiring browser APIs', () => {
    for (const Page of [
      MarkdownPreview,
      CssFormatter,
      ColorContrastChecker,
      ImageCompressor,
    ])
      expect(
        renderToString(
          <MemoryRouter><LocaleProvider locale="en" initialMessages={messages}>
            <Page />
          </LocaleProvider></MemoryRouter>,
        ),
      ).toContain('data-tool=')
  })
})
