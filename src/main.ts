import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // مسیر استاتیک برای پروژه‌ها
  app.use(
    '/uploads/project',
    express.static(join(__dirname, '..', 'public', 'uploads', 'project')),
  );

  // مسیر استاتیک برای فریم‌ورک‌ها
  app.use(
    '/uploads/framework',
    express.static(join(__dirname, '..', 'public', 'uploads', 'framework')),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
