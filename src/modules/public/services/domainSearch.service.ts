import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

import { additionalCharacters, prefixWords, suffixWords } from '../../../../dictionary'
import { Domain, DomainDocument } from 'src/models'
import { DomainFromSearchResponse, DomainResponse, DomainFromSearch } from '../response'
import { DomainHelperService } from './domainHelper.service'
import { DomainService } from './domain.service'
import { getRandomItemsFromArray } from 'src/utils/random'

const LIMIT_DOMAIN_BY_PART_OF_SEARCH = 5

@Injectable()
export class DomainSearchService {
  constructor(
    @InjectModel(Domain.name) private readonly domainModel: Model<DomainDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly domainHelperService: DomainHelperService,
    private readonly domainService: DomainService,
  ) {}

  async searchDomains(domain: string): Promise<DomainFromSearchResponse> {
    if (domain === '') {
      throw new BadRequestException('Missing domain parameter. Please provide a domain for the search.')
    }

    domain = domain.replace(/\s/g, '')

    let domainName: string
    let domainZone: string

    if (!/\./.test(domain)) {
      domainName = domain
      domainZone = domain
    } else {
      const splitedDomain = domain.split('.')
      domainName = splitedDomain[0]
      domainZone = splitedDomain[splitedDomain.length - 1]
    }

    const resultDomainFromSearchResponse: DomainFromSearchResponse = {
      exactMatch: new DomainFromSearch(),
      zone: new DomainFromSearch(),
      similarZones: [],
      differentZones: [],
      similarNames: [],
    }

    const mainDomain = await this.domainService.getMainDomain()

    //добавление полного совпадения
    const exactMatch = await this.findDomainByFullNameForSearch(domain)
    resultDomainFromSearchResponse.exactMatch = exactMatch

    //добавление зоны из поиска
    const zoneDomainDocumentOrNull = await this.domainModel.findOne({ level: 1, name: domainZone })
    if (zoneDomainDocumentOrNull) {
      resultDomainFromSearchResponse.zone = this.domainHelperService.domainDocumentToDomainFromSearch(zoneDomainDocumentOrNull)
    } else {
      resultDomainFromSearchResponse.zone = this.domainNameToDomainFromSearchResponse(domainZone, mainDomain)
    }

    //добавление похожих зон
    resultDomainFromSearchResponse.similarZones = await this.getSimilarDomainZones(domainZone, mainDomain, LIMIT_DOMAIN_BY_PART_OF_SEARCH)

    //добавление того же имене к существующим зонам
    resultDomainFromSearchResponse.differentZones = await this.getDomainsWithExistDomainZones(domainName, LIMIT_DOMAIN_BY_PART_OF_SEARCH)

    //добавление похожего имени к существующим зонам
    resultDomainFromSearchResponse.similarNames = await this.getSimilarDomainsWithExistDomainZones(domainName, LIMIT_DOMAIN_BY_PART_OF_SEARCH)

    return resultDomainFromSearchResponse
  }

  private async findDomainByFullNameForSearch(fullName: string): Promise<DomainFromSearch> {
    const domain = await this.domainModel.findOne({ fullName })

    if (domain === null) {
      if (!/\./.test(fullName)) {
        const mainDomain = await this.domainService.getMainDomain()

        return {
          id: null,
          fullName,
          name: fullName,
          level: 1,
          hPrice: null,
          owner: null,
          address: null,
          parentId: mainDomain.id,
          price: mainDomain.subPrice,
        }
      } else {
        const splitedFullName = fullName.split('.')

        const domainZone = await this.domainModel.findOne({ name: splitedFullName[splitedFullName.length - 1], level: 1 })

        if (domainZone) {
          return {
            id: null,
            fullName,
            name: splitedFullName[0],
            level: 2,
            owner: null,
            hPrice: null,
            address: null,
            parentId: domainZone.id,
            price: domainZone.subPrice,
          }
        } else {
          return {
            id: null,
            fullName,
            name: splitedFullName[0],
            level: 2,
            owner: null,
            hPrice: null,
            address: null,
            parentId: null,
            price: null,
          }
        }
      }
    }

    return this.domainHelperService.domainDocumentToDomainFromSearch(domain)
  }

  private async getSimilarDomainZones(zoneName: string, mainDomain: DomainResponse, limit: number): Promise<DomainFromSearch[]> {
    let zoneNames: string[] = []

    zoneNames = zoneNames.concat(this.addSuffixCharactersToName(zoneName, limit))
    zoneNames = zoneNames.concat(this.addPrefixCharactersToName(zoneName, limit))
    zoneNames = zoneNames.concat(this.addSuffixWordsToName(zoneName, limit))
    zoneNames = zoneNames.concat(this.addPrefixWordsToName(zoneName, limit))

    const uniqueZoneNames = [...new Set(zoneNames)]

    const similarDomainZones: DomainFromSearch[] = []

    for (const zoneName of uniqueZoneNames) {
      const zoneExist = await this.domainModel.exists({ level: 1, name: zoneName })
      if (!zoneExist) {
        similarDomainZones.push(this.domainNameToDomainFromSearchResponse(zoneName, mainDomain))
      }
    }

    return similarDomainZones
  }

  private async getDomainsWithExistDomainZones(domainName: string, limit: number): Promise<DomainFromSearch[]> {
    const domainZonesWithUnoccupiedName = await this.domainModel
      .find({
        level: 1,
        subDomains: { $not: { $elemMatch: { name: domainName } } },
        subPrice: { $ne: 0 },
      })
      .limit(limit)

    const domainsWithExistDomainZones: DomainFromSearch[] = []

    for (const domainZone of domainZonesWithUnoccupiedName) {
      const existDomain = await this.domainModel.findOne({ parentId: domainZone, name: domainName })

      if (existDomain) {
        domainsWithExistDomainZones.push({
          fullName: existDomain.fullName,
          id: existDomain.id,
          level: 2,
          name: domainName,
          hPrice: existDomain.hPrice,
          owner: existDomain.owner,
          address: existDomain.address,
          price: existDomain.price,
          parentId: existDomain.parentId,
        })
      } else {
        domainsWithExistDomainZones.push({
          fullName: `${domainName}.${domainZone.name}`,
          id: null,
          level: 2,
          name: domainName,
          owner: null,
          address: null,
          price: domainZone.subPrice,
          hPrice: null,
          parentId: domainZone.id,
        })
      }
    }

    return domainsWithExistDomainZones
  }

  private async getSimilarDomainsWithExistDomainZones(domainName: string, limit: number): Promise<DomainFromSearch[]> {
    let domainNames: string[] = []

    domainNames = domainNames.concat(this.addSuffixCharactersToName(domainName, limit))
    domainNames = domainNames.concat(this.addPrefixCharactersToName(domainName, limit))
    domainNames = domainNames.concat(this.addSuffixWordsToName(domainName, limit))
    domainNames = domainNames.concat(this.addPrefixWordsToName(domainName, limit))

    const uniqueDomainNames = [...new Set(domainNames)]

    const similarDomainsWithExistDomainZones: DomainFromSearch[] = []

    for (const domainName of uniqueDomainNames) {
      const domainZonesWithUnoccupiedName = await this.domainModel
        .find({
          level: 1,
          subDomains: { $not: { $elemMatch: { name: domainName } } },
          subPrice: { $ne: 0 },
        })
        .limit(3)
      for (const domainZone of domainZonesWithUnoccupiedName) {
        similarDomainsWithExistDomainZones.push({
          fullName: `${domainName}.${domainZone.name}`,
          id: null,
          level: 2,
          name: domainName,
          address: null,
          owner: null,
          price: domainZone.subPrice,
          hPrice: null,
          parentId: domainZone.id,
        })
      }
    }

    return similarDomainsWithExistDomainZones
  }

  private addSuffixCharactersToName(name: string, limit: number): string[] {
    return getRandomItemsFromArray(additionalCharacters, limit).map((additionalSuffix) => name + additionalSuffix)
  }

  private addSuffixWordsToName(name: string, limit: number): string[] {
    return getRandomItemsFromArray(suffixWords, limit).map((additionalSuffix) => name + additionalSuffix)
  }

  private addPrefixCharactersToName(name: string, limit: number): string[] {
    return getRandomItemsFromArray(additionalCharacters, limit).map((additionalPrefix) => additionalPrefix + name)
  }

  private addPrefixWordsToName(name: string, limit: number): string[] {
    return getRandomItemsFromArray(prefixWords, limit).map((additionalPrefix) => additionalPrefix + name)
  }

  private domainNameToDomainFromSearchResponse(domainName: string, mainDomain: DomainResponse): DomainFromSearch {
    return {
      id: null,
      name: domainName,
      fullName: domainName,
      level: 1,
      hPrice: null,
      owner: null,
      address: null,
      parentId: mainDomain.id,
      price: mainDomain.subPrice,
    }
  }

  async findDomainByOwner(owner: string): Promise<DomainResponse[]> {
    if (owner === '') {
      throw new BadRequestException('Missing owner parameter. Please provide a owner for the search.')
    }

    const domains = await this.domainModel.find({ owner }).sort({ level: 1 })

    return this.domainHelperService.domainsDocumentToDomainsResponse(domains)
  }

  async findDomainByFullName(fullName: string): Promise<DomainResponse> {
    if (fullName === '') {
      throw new BadRequestException('Missing fullName parameter. Please provide a fullName for the search.')
    }

    const domain = await this.domainModel.findOne({ fullName })

    if (!domain) {
      throw new NotFoundException(`Domain with full name ${fullName} does not exist`)
    }

    return this.domainHelperService.domainDocumentToDomainResponse(domain)
  }
}
