import { Module, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InjectModel, MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { WinstonModule } from 'nest-winston'
import { format, transports } from 'winston'

import { DomainHelperService, PublicModule } from './modules/public'
import { SchedulerModule } from './modules/scheduler'
import { VenomModule } from './modules/venom'

@Module({
  imports: [
    ConfigModule.forRoot({
      //настройка конфигурации из .env файла
      envFilePath: `${process.cwd()}/.env`,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get('DB_URL')
        if (!uri) {
          throw new Error(`Not found DB_URL env`)
        }
        return {
          uri,
        }
      },
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.colorize({ all: true }),
        format.simple(),
        format.printf((info) => {
          return `[${info.level}] ${info.message}`
        }),
      ),
      transports: [new transports.Console()],
    }),
    PublicModule,
    VenomModule,
    SchedulerModule,
  ],
  providers: [],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly domainHelperService: DomainHelperService) {}

  async onApplicationBootstrap() {
    await this.domainHelperService.createMainDomainIfNotExists()
  }
}
