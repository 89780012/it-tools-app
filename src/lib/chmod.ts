export function parsePermissions(input: string): number {
  if (/^[0-7]{3,4}$/.test(input)) return parseInt(input, 8)
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(input))
    throw new Error('invalid')
  let mode = 0
  for (let group = 0; group < 3; group++) {
    const triplet = input.slice(group * 3, group * 3 + 3)
    const bits =
      (triplet[0] === 'r' ? 4 : 0) +
      (triplet[1] === 'w' ? 2 : 0) +
      (/[xst]/.test(triplet[2]) ? 1 : 0)
    mode |= bits << ((2 - group) * 3)
    if (/[sStT]/.test(triplet[2])) mode |= 1 << (11 - group)
  }
  return mode
}
export function symbolicPermissions(mode: number) {
  if (!Number.isInteger(mode) || mode < 0 || mode > 0o7777)
    throw new Error('invalid')
  return [2, 1, 0]
    .map((shift, index) => {
      const bits = (mode >> (shift * 3)) & 7
      const special = mode & (1 << (11 - index))
      const execute = special
        ? index === 2
          ? bits & 1
            ? 't'
            : 'T'
          : bits & 1
            ? 's'
            : 'S'
        : bits & 1
          ? 'x'
          : '-'
      return `${bits & 4 ? 'r' : '-'}${bits & 2 ? 'w' : '-'}${execute}`
    })
    .join('')
}
export function permissionCommand(mode: number, path: string) {
  symbolicPermissions(mode)
  return `chmod ${mode.toString(8).padStart(3, '0')} -- '${path.replaceAll("'", "'\\''")}'`
}
