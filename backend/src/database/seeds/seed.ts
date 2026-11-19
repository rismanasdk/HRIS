import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source.js';
import { Permission } from '../entities/permission.entity.js';
import { Position } from '../entities/position.entity.js';
import { Role } from '../entities/role.entity.js';
import { User } from '../entities/user.entity.js';

const permissionCodes = [
  'org:view_tree',
  'org:manage_positions',
  'rbac:manage_roles',
  'user:manage',
  'attendance:view_own',
  'attendance:view_team',
  'attendance:approve',
  'attendance:view_all',
  'profile:view_own',
] as const;

const generalManagerPermissions = [
  'org:view_tree',
  'org:manage_positions',
  'rbac:manage_roles',
  'user:manage',
  'attendance:view_own',
  'attendance:view_team',
  'attendance:approve',
  'profile:view_own',
] as const;

const employeePermissions = [
  'org:view_tree',
  'attendance:view_own',
  'profile:view_own',
] as const;

async function seed(): Promise<void> {
  if (process.env.DB_SYNCHRONIZE !== 'false') {
    AppDataSource.setOptions({ synchronize: true });
  }
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const permissionRepository = manager.getRepository(Permission);
      for (const code of permissionCodes) {
        const existing = await permissionRepository.findOneBy({ code });
        const permission = existing ?? permissionRepository.create({ code });
        permission.module = code.split(':')[0];
        permission.description ??= null;
        await permissionRepository.save(permission);
      }

      const positionRepository = manager.getRepository(Position);
      const ensurePosition = async (
        title: string,
        parent: Position | null,
      ): Promise<Position> => {
        const position =
          (await positionRepository.findOne({ where: { title } })) ??
          positionRepository.create({ title });
        position.department ??= null;
        position.parent = parent;
        position.parentId = parent?.id ?? null;
        return positionRepository.save(position);
      };

      const directorPosition = await ensurePosition('Direksi', null);
      const generalManagerPosition = await ensurePosition(
        'General Manager',
        directorPosition,
      );
      await ensurePosition('Karyawan', generalManagerPosition);

      const permissions = await permissionRepository.find();
      const permissionByCode = new Map(
        permissions.map((permission) => [permission.code, permission]),
      );
      const roleRepository = manager.getRepository(Role);
      const ensureRole = async (
        name: string,
        isSystem: boolean,
        codes: readonly string[],
      ): Promise<Role> => {
        const role =
          (await roleRepository.findOne({ where: { name } })) ??
          roleRepository.create({ name });
        role.isSystem = isSystem;
        role.description ??= null;
        role.permissions = codes.map((code) => {
          const permission = permissionByCode.get(code);
          if (!permission) {
            throw new Error(`Seed permission not found: ${code}`);
          }
          return permission;
        });
        return roleRepository.save(role);
      };

      const directorRole = await ensureRole('Direksi', true, permissionCodes);
      await ensureRole('General Manager', false, generalManagerPermissions);
      await ensureRole('Karyawan', false, employeePermissions);

      const userRepository = manager.getRepository(User);
      const existingAdmin = await userRepository.findOneBy({
        email: 'direksi@company.com',
      });
      const admin =
        existingAdmin ??
        userRepository.create({
          email: 'direksi@company.com',
          passwordHash: await bcrypt.hash('password123', 12),
        });
      admin.name = 'Direksi';
      admin.role = directorRole;
      admin.roleId = directorRole.id;
      admin.position = directorPosition;
      admin.positionId = directorPosition.id;
      admin.isActive = true;
      await userRepository.save(admin);
    });

    console.info('Database seed completed successfully.');
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Database seed failed:', error);
  process.exitCode = 1;
});