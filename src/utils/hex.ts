export const normolizeHex = (hex: Buffer | number | string): string => {
  let resultHex = ''

  if (Buffer.isBuffer(hex)) {
    hex = hex.toString('hex')
  }

  if (typeof hex === 'number') {
    hex = hex.toString()
  }

  if (typeof hex === 'string') {
    resultHex = hex.toLowerCase()
  }

  if (resultHex.startsWith('0x')) {
    resultHex = resultHex.slice(2)
  }

  if (resultHex === '') {
    resultHex = '0'
  }

  const data = resultHex.length % 2 ? `0${resultHex}` : resultHex

  if (Buffer.from(data, 'hex')) {
    resultHex = data
  }

  if (!resultHex.startsWith('0x')) {
    resultHex = `0x${resultHex}`
  }

  return resultHex
}

export const isHexString = (hexStr: string): boolean => {
  const hexChars = '0123456789ABCDEFabcdefx'

  for (const char of hexStr) {
    if (hexChars.indexOf(char) === -1) {
      return false
    }
  }
  return true
}

export const bufferToHex = (b: Buffer | Uint8Array): string => {
  return '0x' + Buffer.from(b).toString('hex')
}

export const fixEvmHex = (hex: string): string | undefined => {
  if (hex.slice(2).length === 40) {
    return hex
  } else if (hex.slice(2).length === 38) {
    return `0x00${hex.slice(2)}`
  } else {
    return undefined
  }
}
