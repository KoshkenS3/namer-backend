import { Controller, Get, Param, Post, Body, Query, Delete } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { LinkedAddressRequest } from '../request'
import { DomainResponse } from '../response'
import { LinkedAddressService } from '../services'

@ApiTags('LinkedAddress')
@Controller('domain')
export class DomainLinkedAddressController {
  constructor(private readonly linkedAddressService: LinkedAddressService) {}

  @ApiOkResponse({ type: Array<DomainResponse> })
  @Get('linkedAddress')
  async getDomainsBylinkedAddress(@Query() body: LinkedAddressRequest): Promise<DomainResponse[]> {
    return this.linkedAddressService.findDomainByLinkedAddress(body)
  }

  @ApiOkResponse({ type: DomainResponse })
  @Post(':id/linkedAddress')
  async addlinkedAddressesDomainByDomainId(@Param('id') id: string, @Body() body: LinkedAddressRequest): Promise<DomainResponse> {
    return this.linkedAddressService.addLinkedAddress(id, body)
  }

  @ApiOkResponse({ type: DomainResponse })
  @Delete(':id/linkedAddress')
  async removelinkedAddressesDomainByDomainId(@Param('id') id: string, @Body() body: LinkedAddressRequest): Promise<DomainResponse> {
    return this.linkedAddressService.removeLinkedAddress(id, body)
  }
}
