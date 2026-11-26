import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import { ImageBatch } from '@/components/tools/image-batch'
import ImageCompressor from '../[locale]/tools/image-compressor/page'
import { frontendEncodeImage, frontendLoadImage } from '@/lib/frontend-image'

vi.mock('@/lib/frontend-image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/frontend-image')>()),
  frontendLoadImage: vi.fn(),
  frontendEncodeImage: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}
function mount(Component: React.ComponentType) {
  return render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <Component />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const image = { naturalWidth: 100, naturalHeight: 60 } as HTMLImageElement
const file = new File(['png'], 'test.png', { type: 'image/png' })
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:result')
      static revokeObjectURL = vi.fn()
    },
  )
  vi.mocked(frontendLoadImage).mockResolvedValue({
    image,
    url: 'blob:source',
  })
  vi.mocked(frontendEncodeImage).mockResolvedValue(
    new Blob(['encoded'], { type: 'image/png' }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('image crop, rotation and cancellation', () => {
  it('preserves scale and locked proportions when cropping, rotating and relocking', async () => {
    mount(ImageCompressor)
    fireEvent.change(screen.getByTestId('image-upload'), {
      target: { files: [file] },
    })
    await screen.findByLabelText('Crop width')
    fireEvent.change(screen.getByTestId('image-width'), {
      target: { value: '50' },
    })
    fireEvent.change(screen.getAllByLabelText('Rotation')[0], {
      target: { value: '90' },
    })
    expect(screen.getByTestId('image-width')).toHaveValue(30)
    expect(screen.getByTestId('image-height')).toHaveValue(50)
    fireEvent.change(screen.getByLabelText('Crop width'), {
      target: { value: '50' },
    })
    expect(screen.getByTestId('image-width')).toHaveValue(30)
    expect(screen.getByTestId('image-height')).toHaveValue(25)
    fireEvent.click(screen.getByTestId('image-aspect'))
    fireEvent.change(screen.getByTestId('image-height'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByTestId('image-aspect'))
    expect(screen.getByTestId('image-height')).toHaveValue(25)
    fireEvent.click(screen.getByTestId('image-compress'))
    await screen.findByTestId('image-download')
    expect(frontendEncodeImage).toHaveBeenLastCalledWith(
      image,
      30,
      25,
      'image/webp',
      0.8,
      '#ffffff',
      { x: 0, y: 0, cropWidth: 50, cropHeight: 60, rotation: 90 },
    )
  })

  for (const phase of ['load', 'read'] as const) {
    it(`keeps cancelled ${phase} operations from changing the next batch and releases URLs`, async () => {
      const oldLoad = deferred<Awaited<ReturnType<typeof frontendLoadImage>>>()
      const nextLoad = deferred<Awaited<ReturnType<typeof frontendLoadImage>>>()
      const oldRead = deferred<ArrayBuffer>()
      const read = vi.fn(() => oldRead.promise)
      vi.mocked(frontendLoadImage)
        .mockReset()
        .mockReturnValueOnce(
          phase === 'load'
            ? oldLoad.promise
            : Promise.resolve({ image, url: 'blob:old' }),
        )
        .mockReturnValueOnce(nextLoad.promise)
      vi.mocked(frontendEncodeImage).mockResolvedValue({
        type: 'image/png',
        arrayBuffer: read,
      } as unknown as Blob)
      mount(ImageBatch)
      fireEvent.change(screen.getByTestId('batch-images'), {
        target: { files: [file] },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Process images' }))
      if (phase === 'read')
        await waitFor(() => expect(read).toHaveBeenCalledOnce())
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      fireEvent.click(screen.getByRole('button', { name: 'Process images' }))
      await act(async () => {
        oldLoad.resolve({ image, url: 'blob:old' })
        oldRead.resolve(new Uint8Array([1, 2, 3]).buffer)
      })
      expect(screen.getByRole('status')).toHaveTextContent('0 / 1')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old')
      if (phase === 'load') expect(frontendEncodeImage).not.toHaveBeenCalled()
      expect(screen.queryByRole('link', { name: 'Download ZIP' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await act(async () => nextLoad.resolve({ image, url: 'blob:next' }))
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:next')
    })
  }
})
