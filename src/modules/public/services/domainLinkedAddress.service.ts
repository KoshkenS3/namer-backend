import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

import { Domain, DomainDocument } from 'src/models'
import { LinkedAddressRequest } from '../request'
import { DomainResponse } from '../response'
import { DomainHelperService } from './domainHelper.service'

@Injectable()
export class LinkedAddressService {
  constructor(
    @InjectModel(Domain.name) private readonly domainModel: Model<DomainDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly domainHelperService: DomainHelperService,
  ) {}

  async addLinkedAddress(id: string, linkedAddress: LinkedAddressRequest): Promise<DomainResponse> {
    const chainExist = await this.domainModel.exists({ _id: id, linkedAddresses: { $elemMatch: { chain: linkedAddress.chain } } })

    if (chainExist) {
      throw new BadRequestException(`Cannot add a linked address with the same chain that already exists`)
    }

    const domain = await this.domainModel.findOneAndUpdate<Domain>(
      { _id: id },
      {
        $addToSet: { linkedAddresses: linkedAddress },
      },
      {
        new: true,
      },
    )

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} does not exist`)
    }

    return this.domainHelperService.domainDocumentToDomainResponse(domain)
  }

  async removeLinkedAddress(id: string, linkedAddress: LinkedAddressRequest): Promise<DomainResponse> {
    const domain = await this.domainModel.findOneAndUpdate<Domain>(
      { _id: id },
      {
        $pull: { linkedAddresses: linkedAddress },
      },
      {
        new: true,
      },
    )

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} does not exist`)
    }

    return this.domainHelperService.domainDocumentToDomainResponse(domain)
  }

  async findDomainByLinkedAddress(linkedAddress: LinkedAddressRequest): Promise<DomainResponse[]> {
    const domains = await this.domainModel.find<Domain>({
      linkedAddresses: {
        $elemMatch: linkedAddress,
      },
    })

    return this.domainHelperService.domainsDocumentToDomainsResponse(domains)
  }
}
