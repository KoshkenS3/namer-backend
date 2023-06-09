import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

import { Domain, DomainDocument } from 'src/models'
import { UpdateDomainRequest } from '../request'
import { DomainFromSearchResponse, DomainResponse } from '../response'
import { DomainHelperService } from './domainHelper.service'

@Injectable()
export class DomainService {
  constructor(
    @InjectModel(Domain.name) private readonly domainModel: Model<DomainDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly domainHelperService: DomainHelperService,
  ) {}

  async getMainDomain(): Promise<DomainResponse> {
    const mainDomain = await this.domainModel.findOne({ level: 0 })

    if (!mainDomain) {
      throw new NotFoundException('Main domain does not exist')
    }

    return this.domainHelperService.domainDocumentToDomainResponse(mainDomain)
  }

  async updateDomain(id: string, { additionalData, subPrice }: UpdateDomainRequest): Promise<DomainResponse> {
    const domain = await this.domainModel.findById(id)

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} does not exist`)
    }

    await domain.updateOne(
      {
        subPrice: subPrice,
        additionalData: additionalData,
      },
      { new: true },
    )

    const updatedDocument = await this.domainModel.findOne({ _id: id })

    return this.domainHelperService.domainDocumentToDomainResponse(updatedDocument!)
  }

  async findDomainById(id: string): Promise<DomainResponse> {
    const domain = await this.domainModel.findById(id)

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} does not exist`)
    }

    return this.domainHelperService.domainDocumentToDomainResponse(domain)
  }

  async findDomainByIdWithPopulate(id: string): Promise<DomainResponse> {
    const domain = await this.domainModel.findById(id).populate('subDomains')

    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} does not exist`)
    }

    return this.domainHelperService.domainDocumentToDomainResponse(domain)
  }
}
