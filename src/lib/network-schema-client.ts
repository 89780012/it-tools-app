import { NetworkToolError, type validateJsonSchema } from './network-additions'

export type SchemaValidationResult = ReturnType<typeof validateJsonSchema>
export interface SchemaValidationJob {
  promise: Promise<SchemaValidationResult>
  cancel: () => void
}

export function startSchemaValidation(
  schema: string,
  data: string,
): SchemaValidationJob {
  let worker: Worker | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let complete = false
  let cancel = () => {}
  const promise = new Promise<SchemaValidationResult>((resolve, reject) => {
    const finish = (result?: SchemaValidationResult, error?: string) => {
      if (complete) return
      complete = true
      clearTimeout(timer)
      worker?.terminate()
      if (error) reject(new NetworkToolError(error))
      else resolve(result!)
    }
    cancel = () => finish(undefined, 'workerError')
    try {
      worker = new Worker(
        new URL('./network-schema.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.onmessage = (
        event: MessageEvent<{
          result?: SchemaValidationResult
          error?: string
        }>,
      ) => {
        if (event.data.error) finish(undefined, event.data.error)
        else if (event.data.result) finish(event.data.result)
        else finish(undefined, 'workerError')
      }
      worker.onerror = () => finish(undefined, 'workerError')
      timer = setTimeout(() => finish(undefined, 'timeout'), 2000)
      worker.postMessage({ schema, data })
    } catch {
      finish(undefined, 'workerError')
    }
  })
  return { promise, cancel: () => cancel() }
}
