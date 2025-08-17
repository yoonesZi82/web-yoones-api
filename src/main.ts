import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  app.enableCors({ origin: 'https://myprojectlanding.ir' });

  app.use(
    '/uploads/project',
    express.static(join(__dirname, '..', 'public', 'uploads', 'project')),
  );

  app.use(
    '/uploads/framework',
    express.static(join(__dirname, '..', 'public', 'uploads', 'framework')),
  );

  const config = new DocumentBuilder()
    .setTitle('Web Yoones Api')
    .setDescription('Description for web yoones api')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server is running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
