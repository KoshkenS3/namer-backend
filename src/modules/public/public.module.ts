import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Domain, DomainSchema } from 'src/models'
import { VenomModule } from '../venom'
import { DomainController, DomainLinkedAddressController, DomainSearchController } from './controllers'
import { DomainService, DomainHelperService, LinkedAddressService, DomainSearchService } from './services'

@Module({
  imports: [MongooseModule.forFeature([{ name: Domain.name, schema: DomainSchema }]), VenomModule],
  controllers: [DomainLinkedAddressController, DomainSearchController, DomainController],
  providers: [DomainHelperService, DomainService, LinkedAddressService, DomainSearchService],
  exports: [DomainHelperService],
})
export class PublicModule {}
