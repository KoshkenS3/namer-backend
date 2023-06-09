export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const getRandomItemsFromArray = <T>(array: T[], count: number): T[] => {
  const randomCharacters = []

  while (randomCharacters.length < count) {
    const randomIndex = Math.floor(Math.random() * array.length)
    randomCharacters.push(array[randomIndex])
  }

  return randomCharacters
}
