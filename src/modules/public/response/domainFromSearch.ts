import { ApiProperty } from '@nestjs/swagger'

export class DomainFromSearch {
  @ApiProperty()
  id: string | null

  @ApiProperty()
  parentId: string | null

  @ApiProperty()
  name: string

  @ApiProperty()
  fullName: string

  @ApiProperty()
  owner: string | null

  @ApiProperty()
  address: string | null

  @ApiProperty()
  level: number

  @ApiProperty()
  price: number | null

  @ApiProperty()
  hPrice: number | null
}
export class DomainFromSearchResponse {
  @ApiProperty({ description: 'Exact match with the search query' })
  exactMatch: DomainFromSearch

  @ApiProperty({ description: 'Exact match with the domain zone in the search query' })
  zone: DomainFromSearch

  @ApiProperty({ description: 'Domain zones similar to the one in the search query' })
  similarZones: DomainFromSearch[]

  @ApiProperty({ description: 'Exact domain name from the search query with other existing domain zones' })
  differentZones: DomainFromSearch[]

  @ApiProperty({ description: 'Similar domain names from the search query with other existing domain zones' })
  similarNames: DomainFromSearch[]
}
