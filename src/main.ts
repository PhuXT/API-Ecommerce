import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as config from 'config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(
    `${config.get('service.baseUrl')}${config.get('service.apiVersion')}`,
  );

  const configDocs = new DocumentBuilder()
    .setTitle(`${config.get('service.name')}`)
    .setDescription(`${config.get('service.name')}`)
    .setVersion(`${config.get('service.apiVersion')}`)
    .addBearerAuth()
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const document = SwaggerModule.createDocument(app, configDocs);
  SwaggerModule.setup(`${config.get('service.docsBaseUrl')}`, app, document);
  await app.listen(config.get('server.port'));
}
bootstrap();
