import { IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from 'class-validator';

export class AppConfig {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;
}
