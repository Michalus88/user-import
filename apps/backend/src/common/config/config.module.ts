import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './app-config';

function validate(raw: Record<string, unknown>): AppConfig {
  const validated = plainToInstance(AppConfig, raw, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }
  return validated;
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
  providers: [
    {
      provide: AppConfig,
      useFactory: (): AppConfig =>
        plainToInstance(AppConfig, process.env, { enableImplicitConversion: true }),
    },
  ],
  exports: [AppConfig],
})
export class ConfigModule {}
