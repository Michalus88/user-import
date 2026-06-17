import { IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from 'class-validator';

export class AppConfig {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string = 'postgresql://postgres:postgres@localhost:5432/user_import?schema=public';

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;
}
