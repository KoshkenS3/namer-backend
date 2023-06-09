import { Controller, Get, Param, Post, Body, Patch, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { UpdateDomainRequest } from '../request'
import { DomainResponse } from '../response'
import { DomainHelperService, DomainService } from '../services'

@ApiTags('Domain')
@Controller('domain')
export class DomainController {
  constructor(private readonly domainService: DomainService, private readonly domainHelperService: DomainHelperService) {}

  @ApiOkResponse({ type: DomainResponse })
  @Get('main')
  async getMainDomain(): Promise<DomainResponse> {
    return this.domainService.getMainDomain()
  }

  @ApiOkResponse({ type: DomainResponse })
  @Post('fetch')
  async fetchDomain(): Promise<void> {
    return this.domainHelperService.scanVenomNftsAndCreate()
  }

  @ApiOkResponse({ type: DomainResponse })
  @Patch(':id')
  async updateDomain(@Param('id') id: string, @Body() body: UpdateDomainRequest): Promise<DomainResponse> {
    return this.domainService.updateDomain(id, body)
  }

  @ApiOkResponse({ type: DomainResponse })
  @Get(':id')
  async getDomainById(@Param('id') id: string, @Query('subDomains') populateSubDomains: boolean): Promise<DomainResponse> {
    if (populateSubDomains) {
      return this.domainService.findDomainByIdWithPopulate(id)
    } else {
      return this.domainService.findDomainById(id)
    }
  }
}
