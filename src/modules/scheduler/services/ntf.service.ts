import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { DomainHelperService } from 'src/modules/public'

import { NftService } from 'src/modules/venom/services'
import { Logger } from 'winston'

const TIME_SCHULDER = 60

@Injectable()
export class SchedulerNftsService {
  private bridgeSchedulerWork = true

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly domainHelperService: DomainHelperService,
  ) {
    this.startScanNftScheduler()
  }

  private async startScanNftScheduler(): Promise<void> {
    const job = new CronJob(`*/${TIME_SCHULDER} * * * * *`, async () => {
      if (this.bridgeSchedulerWork) {
        return
      }

      this.bridgeSchedulerWork = true
      this.logger.info(`ScanNft scheduler start`)

      await this.domainHelperService.scanVenomNftsAndCreate()

      this.logger.info(`ScanNft scheduler end`)
      this.bridgeSchedulerWork = false
    })

    const cronName = `scan_nft_cron`

    this.schedulerRegistry.addCronJob(cronName, job)

    job.start()
    this.logger.info(`Start scheduler ${cronName}`)
  }
}
