import JSON5 from 'json5'
import {
  parse as parseLossless,
  stringify as stringifyLossless,
} from 'lossless-json'
import { jsonrepair } from 'jsonrepair'

export function repairJson(input: string, mode: 'repair' | 'json5') {
  if (!input.trim() || input.length > 1_000_000) throw new Error('invalid')
  const source = mode === 'repair' ? jsonrepair(input) : input
  if (mode === 'repair')
    return {
      output: stringifyLossless(parseLossless(source), null, 2)!,
      changed: source !== input,
    }
  const value: unknown = JSON5.parse(source)
  // JSON5 permits Infinity and NaN, which have no equivalent JSON number.
  const output = JSON.stringify(
    value,
    (_key, item: unknown) => {
      if (
        typeof item === 'number' &&
        (!Number.isFinite(item) ||
          (Number.isInteger(item) && !Number.isSafeInteger(item)))
      )
        throw new Error('nonFinite')
      return item
    },
    2,
  )
  return { output, changed: input !== output }
}
