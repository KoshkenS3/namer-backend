import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { ConfigService } from '@nestjs/config'

import { Domain, DomainDocument } from 'src/models'
import { DomainResponse, DomainFromSearch } from '../response'
import { INft, TNfts } from 'src/modules/venom/interfaces'
import { NftService } from 'src/modules/venom/services'

@Injectable()
export class DomainHelperService {
  constructor(
    @InjectModel(Domain.name) private readonly domainModel: Model<DomainDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly nftService: NftService,
    private readonly configService: ConfigService,
  ) {}

  async createMainDomainIfNotExists(): Promise<void> {
    const mainDomain = await this.domainModel.findOne({ level: 0 })

    if (!mainDomain) {
      const collectionAddress = this.configService.get('COLLECTION_ADDRESS')

      if (!collectionAddress) {
        throw new Error('Not found env COLLECTION_ADDRESS')
      }

      const mainSubPrice = this.configService.get('MAIN_SUB_PRICE')

      if (!mainSubPrice) {
        throw new Error('Not found env MAIN_SUB_PRICE')
      }

      const newMainDomain = await this.domainModel.create({
        name: '',
        parentId: null,
        fullName: '',
        subDomains: [],
        price: 0,
        subPrice: Number(mainSubPrice),
        hPrice: Number(mainSubPrice),
        level: 0,
        owner: '',
        address: collectionAddress,
        linkedAddresses: [],
      })
      this.logger.info(`Main domain create with id: ${newMainDomain.id}`)
    }
  }

  async scanVenomNftsAndCreate(): Promise<void> {
    const mainDomain = await this.domainModel.findOne({ level: 0 })

    if (!mainDomain) {
      this.logger.error(`Not found MainDomain!`)
      return
    }

    const nfts = await this.nftService.getNfts()

    if (nfts instanceof Error) {
      this.logger.error(`Get error from getNfts(): ${nfts}`)
      return
    }

    for (const nft of nfts) {
      const existDomain = await this.domainModel.findOne({ address: nft.address })
      if (!existDomain) {
        if (nft.parentAddress === mainDomain.address) {
          await this.createDomainByNftAndParentDomain(nft, mainDomain, nft.name, 1)
        } else {
          let parentDomain = await this.domainModel.findOne({ address: nft.parentAddress })

          if (!parentDomain) {
            const parentNftIndex = nfts.findIndex((nftInArr) => nftInArr.address === nft.parentAddress)

            if (parentNftIndex === -1) {
              this.logger.error(`Not found nft.parentAddress in nfts `)
              continue
            }

            const parentNft = nfts[parentNftIndex]

            parentDomain = await this.createDomainByNftAndParentDomain(parentNft, mainDomain, parentNft.name, 1)

            nfts.splice(parentNftIndex, 1)
          }

          const nftFullName = await this.getDomainFullName(parentDomain.id, nft.name)

          await this.createDomainByNftAndParentDomain(nft, parentDomain, nftFullName, 2)
        }
      } else {
        if (existDomain.owner != nft.owner) {
          await existDomain.updateOne(
            {
              owner: nft.owner,
              $set: { linkedAddresses: [] },
            },
            { new: true },
          )
        }

        if (existDomain.hPrice != nft.hPrice) {
          await existDomain.updateOne(
            {
              hPrice: nft.hPrice,
            },
            { new: true },
          )
        }

        if (existDomain.subPrice != nft.subPrice) {
          await existDomain.updateOne(
            {
              subPrice: nft.subPrice,
            },
            { new: true },
          )
        }
      }
    }
  }

  private async createDomainByNftAndParentDomain(nft: INft, parentDomain: DomainDocument, fullName: string, level: number): Promise<DomainDocument> {
    const newDomain = await this.domainModel.create({
      address: nft.address,
      owner: nft.owner,
      level: level,
      name: nft.name,
      fullName: fullName,
      price: parentDomain.hPrice,
      hPrice: nft.hPrice,
      subPrice: nft.subPrice,
      nftId: nft.id,
      parentId: parentDomain.id,
    })

    await parentDomain.updateOne({ $push: { subDomains: newDomain.id } })

    this.logger.info(`Create domain with id ${newDomain.id} address ${newDomain.address} name ${newDomain.fullName} owner: ${newDomain.owner}`)

    return newDomain
  }

  async getDomainFullName(parentId: string, name: string): Promise<string> {
    let parentDomain: DomainDocument | null

    do {
      parentDomain = await this.domainModel.findById(parentId)

      if (parentDomain) {
        parentId = parentDomain.parentId
        if (parentDomain.level !== 0) {
          name = `${name}.${parentDomain.name}`
        }
      }
    } while (parentDomain)

    return name
  }

  domainDocumentToDomainResponse(domainDocument: DomainDocument): DomainResponse {
    return {
      id: domainDocument.id,
      name: domainDocument.name,
      parentId: domainDocument.parentId,
      owner: domainDocument.owner,
      price: domainDocument.price,
      fullName: domainDocument.fullName,
      level: domainDocument.level,
      linkedAddresses: domainDocument.linkedAddresses,
      address: domainDocument.address,
      additionalData: domainDocument.additionalData,
      hPrice: domainDocument.hPrice,
      nftId: domainDocument.nftId,
      subDomains: domainDocument.subDomains.map((domainDocument: DomainDocument | string) => {
        if (typeof domainDocument === 'string') {
          return domainDocument
        } else {
          return this.domainDocumentToDomainResponse(domainDocument)
        }
      }),
      subPrice: domainDocument.subPrice,
    }
  }

  domainsDocumentToDomainsResponse(domainDocuments: DomainDocument[]): DomainResponse[] {
    return domainDocuments.map((domainDocument): DomainResponse => {
      return {
        id: domainDocument.id,
        name: domainDocument.name,
        parentId: domainDocument.parentId,
        price: domainDocument.price,
        hPrice: domainDocument.hPrice,
        fullName: domainDocument.fullName,
        address: domainDocument.address,
        owner: domainDocument.owner,
        level: domainDocument.level,
        linkedAddresses: domainDocument.linkedAddresses,
        additionalData: domainDocument.additionalData,
        nftId: domainDocument.nftId,
        subDomains: domainDocument.subDomains.map((domainDocument: DomainDocument | string) => {
          if (typeof domainDocument === 'string') {
            return domainDocument
          } else {
            return this.domainDocumentToDomainResponse(domainDocument)
          }
        }),
        subPrice: domainDocument.subPrice,
      }
    })
  }

  domainDocumentToDomainFromSearch(domainDocument: DomainDocument): DomainFromSearch {
    return {
      id: domainDocument.id,
      name: domainDocument.name,
      price: domainDocument.price,
      parentId: domainDocument.parentId,
      fullName: domainDocument.fullName,
      address: domainDocument.address,
      owner: domainDocument.owner,
      level: domainDocument.level,
      hPrice: domainDocument.hPrice,
    }
  }

  domainsDocumentToDomainsFromSearch(domainDocuments: DomainDocument[]): DomainFromSearch[] {
    return domainDocuments.map((domainDocument): DomainFromSearch => {
      return {
        id: domainDocument.id,
        name: domainDocument.name,
        price: domainDocument.price,
        hPrice: domainDocument.hPrice,
        parentId: domainDocument.parentId,
        fullName: domainDocument.fullName,
        address: domainDocument.address,
        owner: domainDocument.owner,
        level: domainDocument.level,
      }
    })
  }
}
