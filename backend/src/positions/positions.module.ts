import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Position } from '../database/entities/position.entity.js';
import { User } from '../database/entities/user.entity.js';
import { PositionsController } from './positions.controller.js';
import { PositionsService } from './positions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Position, User]), AuthModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}