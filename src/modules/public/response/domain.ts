import { ApiProperty } from '@nestjs/swagger'
import { LinkedAddressRequest } from '../request'

export class LinkedAddress {
  @ApiProperty()
  chain: string

  @ApiProperty()
  address: string
}

export class DomainResponse {
  @ApiProperty()
  id: string

  @ApiProperty()
  nftId: number

  @ApiProperty()
  name: string

  @ApiProperty()
  fullName: string

  @ApiProperty()
  parentId: string

  @ApiProperty()
  owner: string

  @ApiProperty()
  address: string

  @ApiProperty()
  level: number

  @ApiProperty()
  price: number

  @ApiProperty()
  hPrice: number

  @ApiProperty({ type: [LinkedAddressRequest] })
  linkedAddresses: LinkedAddress[]

  @ApiProperty()
  subPrice: number

  @ApiProperty({ type: [DomainResponse, String] })
  subDomains: Array<DomainResponse | string>

  @ApiProperty()
  additionalData: object
}
