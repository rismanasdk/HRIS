import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../database/entities/permission.entity.js';
import { Role } from '../database/entities/role.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  findPermissions(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { module: 'ASC', code: 'ASC' } });
  }

  findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: { permissions: true },
      order: { id: 'ASC' },
    });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const permissions = await this.getPermissions(dto.permissionIds);
    const role = this.rolesRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      isSystem: false,
      permissions,
    });
    return this.rolesRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds !== undefined) {
      role.permissions = await this.getPermissions(dto.permissionIds);
    }

    return this.rolesRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('System role cannot be deleted');
    }
    await this.rolesRepository.remove(role);
  }

  private async getPermissions(ids: number[]): Promise<Permission[]> {
    const permissions =
      ids.length === 0
        ? []
        : await this.permissionsRepository.find({ where: { id: In(ids) } });
    if (permissions.length !== ids.length) {
      throw new NotFoundException('One or more permissions were not found');
    }
    return permissions;
  }
}