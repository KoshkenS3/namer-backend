import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({ origin: '*' })
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  const config = new DocumentBuilder().setTitle('NAMER API').setDescription('API documentation for NAMER').setVersion('1.0').build()

  const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('/doc', app, document)

  await app.listen(3000)
}
bootstrap()
