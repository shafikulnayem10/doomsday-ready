import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Production: set FRONTEND_URL (comma-separated, no trailing slash).
  // If it is not set, any origin is allowed (local development).
  const frontendUrls = process.env.FRONTEND_URL?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  app.enableCors({
    origin: frontendUrls && frontendUrls.length > 0 ? frontendUrls : true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();