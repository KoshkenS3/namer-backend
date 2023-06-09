import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator'

export class UpdateDomainRequest {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  subPrice: number

  @IsOptional()
  @ApiProperty()
  additionalData: object
}
