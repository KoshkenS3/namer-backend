export const isHttpUrl = (urlStr: string): boolean => {
  let url: URL
  try {
    url = new URL(urlStr)
  } catch (e) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
