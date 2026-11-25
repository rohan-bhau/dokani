import { ROLE_DEFAULT_PERMISSIONS } from '@dokani/shared';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors.js';

export class StaffRepository {
  async listStaff(tenantId: string) {
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        role: u.userRoles[0]?.role?.name || 'CASHIER',
        roleId: u.userRoles[0]?.roleId,
        createdAt: u.createdAt,
      })),
    };
  }

  async updateStaffRole(tenantId: string, userId: string, roleId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundError('User not found in this shop.');
    }

    if (user.userRoles[0]?.role?.name === 'OWNER') {
      throw new BadRequestError('Cannot change the role of the shop owner.');
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundError('Role not found.');
    }

    if (role.name === 'OWNER') {
      throw new BadRequestError('Cannot assign the Owner role to a staff account.');
    }

    // Update user role
    await prisma.userRole.deleteMany({ where: { userId } });
    return prisma.userRole.create({
      data: { userId, roleId },
      include: { role: true },
    });
  }

  async setUserActiveStatus(tenantId: string, userId: string, isActive: boolean) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.userRoles[0]?.role?.name === 'OWNER') {
      throw new BadRequestError('Cannot deactivate the shop owner.');
    }

    // If deactivating, revoke all active refresh tokens immediately
    if (!isActive) {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async ensureDefaultTenantRoles(tenantId: string) {
    const existingRoles = await prisma.role.findMany({
      where: { tenantId },
      select: { name: true },
    });
    const existingNames = new Set(existingRoles.map((r) => r.name));
    const missingEntries = Object.entries(ROLE_DEFAULT_PERMISSIONS).filter(
      ([roleName]) => !existingNames.has(roleName)
    );

    if (missingEntries.length === 0) return;

    const allPermissions = await prisma.permission.findMany({
      select: { id: true, code: true },
    });
    const permIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

    for (const [roleName, permCodes] of missingEntries) {
      const permIds = permCodes
        .map((code) => permIdByCode.get(code))
        .filter((id): id is string => Boolean(id));

      await prisma.role.create({
        data: {
          tenantId,
          name: roleName,
          isSystem: true,
          rolePermissions: {
            create: permIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
    }
  }

  async getRolePermissionMatrix(tenantId: string) {
    await this.ensureDefaultTenantRoles(tenantId);

    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const allPermissions = await prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });

    return {
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        isSystem: r.isSystem,
        permissions: r.rolePermissions.map((rp) => rp.permission.code),
      })),
      allPermissions,
    };
  }

  async updateRolePermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundError('Role not found.');
    }

    if (role.name === 'OWNER') {
      throw new BadRequestError('Cannot modify Owner permissions.');
    }

    if (role.name === 'OWNER') {
      throw new BadRequestError('Cannot modify Owner permissions.');
    }

    await prisma.rolePermission.deleteMany({ where: { roleId } });

    await prisma.rolePermission.createMany({
      data: permissionIds.map((pid) => ({ roleId, permissionId: pid })),
    });

    return this.getRolePermissionMatrix(tenantId);
  }

  async createStaffMember(
    tenantId: string,
    data: {
      name: string;
      phone: string;
      email: string | null;
      passwordHash: string;
      roleId: string;
    }
  ) {
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundError('Selected role does not exist in this store.');
    }

    if (role.name === 'OWNER') {
      throw new BadRequestError('Cannot assign the Owner role to a staff account.');
    }

    const existing = await prisma.user.findFirst({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new BadRequestError('An account with this mobile number already exists.');
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash: data.passwordHash,
        isActive: true,
        userRoles: {
          create: {
            roleId: data.roleId,
          },
        },
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
      role: user.userRoles[0]?.role?.name || role.name,
      roleId: data.roleId,
      createdAt: user.createdAt,
    };
  }
}

export const staffRepository = new StaffRepository();
