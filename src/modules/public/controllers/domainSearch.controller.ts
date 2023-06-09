import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { DomainResponse, DomainFromSearchResponse } from '../response'
import { DomainSearchService, DomainService } from '../services'

@ApiTags('Search')
@Controller('domain')
export class DomainSearchController {
  constructor(private readonly domainSearchService: DomainSearchService) {}

  @ApiOkResponse({ type: Array<DomainResponse> })
  @Get('byOwner')
  async getByOwner(@Query('owner') owner: string): Promise<DomainResponse[]> {
    return this.domainSearchService.findDomainByOwner(owner)
  }

  @ApiOkResponse({ type: DomainResponse })
  @Get('byFullName')
  async getDomainById(@Query('fullName') fullName: string): Promise<DomainResponse> {
    return this.domainSearchService.findDomainByFullName(fullName)
  }

  @ApiOkResponse({ type: DomainFromSearchResponse })
  @Get('search')
  async searchDomains(@Query('domain') domain: string): Promise<DomainFromSearchResponse> {
    return this.domainSearchService.searchDomains(domain)
  }
}
