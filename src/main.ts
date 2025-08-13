import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.use(
    '/uploads/project',
    express.static(join(__dirname, '..', 'public', 'uploads', 'project')),
  );

  app.use(
    '/uploads/framework',
    express.static(join(__dirname, '..', 'public', 'uploads', 'framework')),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
