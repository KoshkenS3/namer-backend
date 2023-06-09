import { Module } from '@nestjs/common'
import { PublicModule } from '../public'
import { NftService } from './services'

@Module({
  imports: [],
  providers: [NftService],
  exports: [NftService],
})
export class VenomModule {}
