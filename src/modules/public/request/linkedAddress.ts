import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class LinkedAddressRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  chain: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  address: string
}
