import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { CORS_ORIGIN, PORT } = app.get(AppConfig);

  app.use(helmet());
  app.enableCors({ origin: CORS_ORIGIN });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(PORT);
}
void bootstrap();
