export interface INft {
  id: number
  address: string
  owner: string
  hPrice: number
  name: string
  parentAddress: string
  subPrice: number
}

export type TNfts = INft[]
