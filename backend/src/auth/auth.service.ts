import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';

const userRelations = {
  role: { permissions: true },
  position: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: userRelations,
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: this.serializeUser(user),
      permissions: this.getPermissionCodes(user),
    };
  }

  async getCurrentUser(userId: number) {
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: userRelations,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is unavailable or inactive');
    }

    return {
      user: this.serializeUser(user),
      permissions: this.getPermissionCodes(user),
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      position: user.position
        ? { id: user.position.id, title: user.position.title }
        : null,
    };
  }

  private getPermissionCodes(user: User): string[] {
    return user.role.permissions.map((permission) => permission.code);
  }
}