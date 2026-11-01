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

    const invitations = await prisma.staffInvitation.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
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
      invitations: invitations.map((inv) => ({
        id: inv.id,
        name: inv.name,
        emailOrPhone: inv.emailOrPhone,
        role: inv.role.name,
        roleId: inv.roleId,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };
  }

  async createInvitation(
    tenantId: string,
    data: { name: string; emailOrPhone: string; roleId: string; tokenHash: string }
  ) {
    // Check if role exists
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!role) {
      throw new NotFoundError('Selected role does not exist.');
    }

    // 48 hours expiry
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    return prisma.staffInvitation.create({
      data: {
        tenantId,
        name: data.name,
        emailOrPhone: data.emailOrPhone,
        roleId: data.roleId,
        tokenHash: data.tokenHash,
        expiresAt,
      },
      include: { role: true },
    });
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
      where: { id: roleId, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!role) {
      throw new NotFoundError('Role not found.');
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

  async getRolePermissionMatrix(tenantId: string) {
    const roles = await prisma.role.findMany({
      where: { OR: [{ tenantId }, { isSystem: true }] },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
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
      where: { id: roleId, OR: [{ tenantId }, { isSystem: true }] },
    });

    if (!role) {
      throw new NotFoundError('Role not found.');
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
}

export const staffRepository = new StaffRepository();
