import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

/*
ConfigModule.forRoot()
- loads .env values into Node.js process.env
- registers ConfigService in NestJS DI container
- isGlobal: true → ConfigService available across app without repeated imports

TypeOrmModule.forRootAsync()
- dynamically creates DB configuration during app startup

inject: [ConfigService]
- DI container injects ConfigService into useFactory()

useFactory()
- factory function that returns DB configuration object

configService.get()
- reads environment variables from process.env/.env

autoLoadEntities: true
- automatically loads DB entities/models

synchronize: true
- auto-sync DB tables with entities (development only)
*/

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: Number(configService.get<string>('POSTGRES_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [__dirname + '/db/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/db/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
