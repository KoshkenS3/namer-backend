import { Module } from '@nestjs/common'

import { PublicModule } from '../public'
import { SchedulerNftsService } from './services'

@Module({
  imports: [PublicModule],
  providers: [SchedulerNftsService],
  exports: [],
})
export class SchedulerModule {}
