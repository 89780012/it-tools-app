import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import { useTranslations } from '@/i18n/compat'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Panel, Field, ErrorMessage } from './workbench'
import {
  frontendLoadImage,
  frontendEncodeImage,
  frontendImageExtension,
  type FrontendImageMime,
} from '@/lib/frontend-image'
export function ImageBatch() {
  const t = useTranslations('expansion')
  const [files, setFiles] = useState<File[]>([]),
    [mime, setMime] = useState<FrontendImageMime>('image/webp'),
    [quality, setQuality] = useState(80),
    [maxWidth, setMaxWidth] = useState(1920),
    [rotation, setRotation] = useState(0),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [download, setDownload] = useState(''),
    [error, setError] = useState('')
  const revision = useRef(0)
  useEffect(
    () => () => {
      revision.current++
    },
    [],
  )
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download)
    },
    [download],
  )
  const reset = () => {
    revision.current++
    setDownload('')
    setBusy(false)
    setError('')
    setProgress(0)
  }
  const run = async () => {
    reset()
    const token = revision.current
    setBusy(true)
    try {
      if (
        !Number.isInteger(maxWidth) ||
        maxWidth < 1 ||
        maxWidth > 16384 ||
        !Number.isFinite(quality) ||
        quality < 1 ||
        quality > 100 ||
        files.length > 30 ||
        files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024
      )
        throw new Error('invalid')
      const zip = new JSZip()
      for (let index = 0; index < files.length; index++) {
        if (token !== revision.current) return
        const loaded = await frontendLoadImage(files[index])
        try {
          if (token !== revision.current) return
          const sourceWidth =
            rotation % 180
              ? loaded.image.naturalHeight
              : loaded.image.naturalWidth
          const sourceHeight =
            rotation % 180
              ? loaded.image.naturalWidth
              : loaded.image.naturalHeight
          const width = Math.min(maxWidth, sourceWidth),
            height = Math.max(
              1,
              Math.round((sourceHeight * width) / sourceWidth),
            )
          const blob = await frontendEncodeImage(
            loaded.image,
            width,
            height,
            mime,
            quality / 100,
            '#ffffff',
            {
              x: 0,
              y: 0,
              cropWidth: loaded.image.naturalWidth,
              cropHeight: loaded.image.naturalHeight,
              rotation,
            },
          )
          if (token !== revision.current) return
          const bytes = await blob.arrayBuffer()
          if (token !== revision.current) return
          zip.file(
            `${index + 1}-${files[index].name.replace(/\.[^.]*$/, '').replace(/[\\/]/g, '_')}.${frontendImageExtension(blob.type)}`,
            bytes,
          )
          setProgress(index + 1)
        } finally {
          URL.revokeObjectURL(loaded.url)
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      if (token === revision.current) setDownload(URL.createObjectURL(blob))
    } catch {
      if (token === revision.current) setError(t('batchImageError'))
    } finally {
      if (token === revision.current) setBusy(false)
    }
  }
  return (
    <Panel title={t('batchImages')}>
      <p className="text-sm text-muted-foreground">{t('batchImageHint')}</p>
      <Field label={t('files')}>
        <Input
          aria-label={t('files')}
          data-testid="batch-images"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            reset()
            setFiles(Array.from(event.target.files ?? []))
          }}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label={t('format')}>
          <select
            aria-label={t('format')}
            className="w-full rounded border bg-background p-2"
            value={mime}
            onChange={(event) => {
              reset()
              setMime(event.target.value as FrontendImageMime)
            }}
          >
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
          </select>
        </Field>
        <Field label={t('quality')}>
          <Input
            aria-label={t('quality')}
            type="number"
            min={1}
            max={100}
            disabled={mime === 'image/png'}
            value={quality}
            onChange={(event) => {
              reset()
              setQuality(Number(event.target.value))
            }}
          />
        </Field>
        <Field label={t('maxWidth')}>
          <Input
            aria-label={t('maxWidth')}
            type="number"
            min={1}
            max={16384}
            value={maxWidth}
            onChange={(event) => {
              reset()
              setMaxWidth(Number(event.target.value))
            }}
          />
        </Field>
        <Field label={t('rotation')}>
          <select
            aria-label={t('rotation')}
            className="w-full rounded border bg-background p-2"
            value={rotation}
            onChange={(event) => {
              reset()
              setRotation(Number(event.target.value))
            }}
          >
            {[0, 90, 180, 270].map((value) => (
              <option key={value} value={value}>
                {value}°
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => void run()} disabled={busy || !files.length}>
          {t('processBatch')}
        </Button>
        <Button variant="outline" disabled={!busy} onClick={reset}>
          {t('cancel')}
        </Button>
        {download && (
          <Button asChild>
            <a href={download} download="images.zip">
              {t('downloadZip')}
            </a>
          </Button>
        )}
      </div>
      {busy && (
        <p role="status">
          {progress} / {files.length}
        </p>
      )}
      <ErrorMessage>{error}</ErrorMessage>
    </Panel>
  )
}
