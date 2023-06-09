export const attemptAndHandleErrors = async <T>(fn: () => Promise<T>, attempts: number): Promise<T | Error> => {
  if (attempts < 1) {
    return new Error(`Attempts must be > 1`)
  }

  let attempt = 0
  let lastError: Error = new Error('Max attempts reached, last error: None')

  while (attempt < attempts) {
    attempt++
    try {
      return await fn()
    } catch (error: any) {
      console.log('AttemptAndHandleErrors catch error')

      if (error instanceof Error) {
        lastError = error
      } else {
        lastError = new Error(`Getting unknown error: ${error}`)
      }
    }
  }

  console.log(`Finil error in AttemptAndHandleErrors by ${attempts} attempts`)

  return lastError
}
