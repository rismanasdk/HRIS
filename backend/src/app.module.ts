import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './database/entities/permission.entity.js';
import { Position } from './database/entities/position.entity.js';
import { Role } from './database/entities/role.entity.js';
import { User } from './database/entities/user.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { PositionsModule } from './positions/positions.module.js';
import { RolesModule } from './roles/roles.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'YES'),
        database: configService.get<string>('DB_DATABASE', 'hris'),
        entities: [Position, Role, Permission, User],
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    PositionsModule,
    RolesModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com,
    // then run `npx @nestjs/observe link` to write your key pair into .env.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
