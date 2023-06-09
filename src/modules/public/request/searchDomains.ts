import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class SearchDomainsRequest {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  keyword: string

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  owner: string
}
