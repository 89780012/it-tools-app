import { useEffect, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
} from '@/components/tools/workbench'
import {
  frontendEncodeImage,
  frontendImageExtension,
  frontendLoadImage,
  frontendResize,
  frontendSavings,
  type FrontendImageMime,
} from '@/lib/frontend-image'

type Source = { file: File; image: HTMLImageElement; url: string }
type Result = { blob: Blob; url: string; width: number; height: number }
export default function ImageCompressor() {
  const t = useTranslations('tools.image-compressor'),
    w = useTranslations('workbench')
  const [source, setSource] = useState<Source | null>(null),
    [result, setResult] = useState<Result | null>(null)
  const [width, setWidth] = useState(''),
    [height, setHeight] = useState(''),
    [locked, setLocked] = useState(true)
  const [mime, setMime] = useState<FrontendImageMime>('image/webp'),
    [quality, setQuality] = useState(80),
    [background, setBackground] = useState('#ffffff')
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const uploadRevision = useRef(0),
    encodeRevision = useRef(0)
  useEffect(
    () => () => {
      uploadRevision.current++
      encodeRevision.current++
    },
    [],
  )
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url)
    },
    [source],
  )
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url)
    },
    [result],
  )
  const invalidate = () => {
    encodeRevision.current++
    setResult(null)
    setBusy(false)
    setError('')
  }
  const showError = (value: unknown) =>
    setError(
      value instanceof Error &&
        ['sizeError', 'dimensionsError', 'fileError', 'encodeError'].includes(
          value.message,
        )
        ? value.message
        : 'encodeError',
    )
  const upload = async (file?: File) => {
    const token = ++uploadRevision.current
    invalidate()
    setSource(null)
    setWidth('')
    setHeight('')
    if (!file) return
    setBusy(true)
    try {
      const loaded = await frontendLoadImage(file)
      if (token !== uploadRevision.current) {
        URL.revokeObjectURL(loaded.url)
        return
      }
      setSource({ ...loaded, file })
      setWidth(String(loaded.image.naturalWidth))
      setHeight(String(loaded.image.naturalHeight))
    } catch (value) {
      if (token === uploadRevision.current) showError(value)
    } finally {
      if (token === uploadRevision.current) setBusy(false)
    }
  }
  const resize = (value: string, axis: 'width' | 'height') => {
    invalidate()
    if (axis === 'width') setWidth(value)
    else setHeight(value)
    if (locked && source && value) {
      try {
        const size = frontendResize(
          source.image.naturalWidth,
          source.image.naturalHeight,
          Number(value),
          axis,
        )
        setWidth(String(size.width))
        setHeight(String(size.height))
      } catch {
        setError('dimensionsError')
      }
    }
  }
  const compress = async () => {
    if (!source) return
    const token = ++encodeRevision.current
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const blob = await frontendEncodeImage(
        source.image,
        Number(width),
        Number(height),
        mime,
        quality / 100,
        background,
      )
      if (token !== encodeRevision.current) return
      setResult({
        blob,
        url: URL.createObjectURL(blob),
        width: Number(width),
        height: Number(height),
      })
    } catch (value) {
      if (token === encodeRevision.current) showError(value)
    } finally {
      if (token === encodeRevision.current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="image-compressor">
      <Panel title={w('input')}>
        <Field label={t('file')} htmlFor="image-file" hint={t('limits')}>
          <Input
            id="image-file"
            data-testid="image-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              void upload(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('format')} htmlFor="image-format">
            <select
              id="image-format"
              data-testid="image-format"
              className="w-full rounded border bg-background p-2"
              value={mime}
              onChange={(e) => {
                invalidate()
                setMime(e.target.value as FrontendImageMime)
              }}
            >
              <option value="image/webp">WebP</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
            </select>
          </Field>
          <Field
            label={t('quality', { value: quality })}
            htmlFor="image-quality"
            hint={t('qualityHint')}
          >
            <input
              id="image-quality"
              data-testid="image-quality"
              type="range"
              min={1}
              max={100}
              value={quality}
              disabled={mime === 'image/png'}
              className="w-full"
              onChange={(e) => {
                invalidate()
                setQuality(Number(e.target.value))
              }}
            />
          </Field>
          <Field label={t('width')} htmlFor="image-width">
            <Input
              id="image-width"
              data-testid="image-width"
              type="number"
              min={1}
              max={16384}
              value={width}
              onChange={(e) => resize(e.target.value, 'width')}
            />
          </Field>
          <Field label={t('height')} htmlFor="image-height">
            <Input
              id="image-height"
              data-testid="image-height"
              type="number"
              min={1}
              max={16384}
              value={height}
              onChange={(e) => resize(e.target.value, 'height')}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            data-testid="image-aspect"
            type="checkbox"
            checked={locked}
            onChange={(e) => {
              invalidate()
              setLocked(e.target.checked)
              if (e.target.checked && source && width) {
                try {
                  const size = frontendResize(
                    source.image.naturalWidth,
                    source.image.naturalHeight,
                    Number(width),
                    'width',
                  )
                  setHeight(String(size.height))
                } catch {
                  setError('dimensionsError')
                }
              }
            }}
          />
          {t('aspect')}
        </label>
        {mime === 'image/jpeg' && (
          <Field label={t('background')} htmlFor="image-background">
            <input
              id="image-background"
              data-testid="image-background"
              type="color"
              value={background}
              onChange={(e) => {
                invalidate()
                setBackground(e.target.value)
              }}
            />
          </Field>
        )}
        <Button
          data-testid="image-compress"
          disabled={!source || busy}
          onClick={compress}
        >
          {busy ? t('processing') : t('compress')}
        </Button>
        <ErrorMessage>{error ? t(error) : null}</ErrorMessage>
      </Panel>
      <div className="grid gap-6 md:grid-cols-2">
        {source && (
          <Panel title={t('original')}>
            <img
              data-testid="image-original"
              src={source.url}
              alt={t('original')}
              className="max-h-80 max-w-full object-contain"
            />
            <p dir="ltr">
              {source.image.naturalWidth} × {source.image.naturalHeight} ·{' '}
              {t('bytes', { value: source.file.size })}
            </p>
          </Panel>
        )}
        {result && source && (
          <Panel title={t('compressed')}>
            <img
              data-testid="image-result"
              src={result.url}
              alt={t('compressed')}
              className="max-h-80 max-w-full object-contain"
            />
            <p data-testid="image-result-info" dir="ltr">
              {result.width} × {result.height} ·{' '}
              {t('bytes', { value: result.blob.size })} · {result.blob.type}
            </p>
            <p data-testid="image-savings">
              {t('savings', {
                value: frontendSavings(
                  source.file.size,
                  result.blob.size,
                ).toFixed(1),
              })}
            </p>
            <p className="text-xs text-muted-foreground">{t('savingsHint')}</p>
            <a
              data-testid="image-download"
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              href={result.url}
              download={`${source.file.name.replace(/\.[^.]*$/, '') || 'image'}-compressed.${frontendImageExtension(result.blob.type)}`}
            >
              {w('download')}
            </a>
          </Panel>
        )}
      </div>
    </Workbench>
  )
}
