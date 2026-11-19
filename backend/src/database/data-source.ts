import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Permission } from './entities/permission.entity.js';
import { Position } from './entities/position.entity.js';
import { Role } from './entities/role.entity.js';
import { User } from './entities/user.entity.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? 'YES',
  database: process.env.DB_DATABASE ?? 'hris',
  entities: [Position, Role, Permission, User],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  charset: 'utf8mb4',
});