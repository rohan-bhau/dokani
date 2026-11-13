import { Permission, ROLE_DEFAULT_PERMISSIONS, SystemRole } from '@dokani/shared';
import type { Tenant, User } from '../../config/prisma.js';
import { prisma } from '../../config/prisma.js';

export interface CreateTenantOwnerParams {
  tenantName: string;
  slug: string;
  name: string;
  phone: string;
  email?: string | undefined;
  passwordHash: string;
}

export class AuthRepository {
  async createTenantAndOwner(params: CreateTenantOwnerParams): Promise<{ tenant: Tenant; user: User }> {
    return prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: params.tenantName,
            slug: params.slug,
            phone: params.phone,
          },
        });

        // Batch insert permissions in a single query
        const permissionCodes = Object.values(Permission);
        await tx.permission.createMany({
          data: permissionCodes.map((code) => ({
            code,
            description: code,
          })),
          skipDuplicates: true,
        });

        const allPermissions = await tx.permission.findMany({
          select: { id: true, code: true },
        });
        const permIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

        // Create default system roles for this tenant with least-privilege permissions
        let ownerRoleId = '';
        for (const [roleName, permCodes] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
          const permIds = permCodes
            .map((code) => permIdByCode.get(code))
            .filter((id): id is string => Boolean(id));

          const createdRole = await tx.role.create({
            data: {
              name: roleName,
              tenantId: tenant.id,
              isSystem: true,
              rolePermissions: {
                create: permIds.map((permissionId) => ({ permissionId })),
              },
            },
          });

          if (roleName === SystemRole.OWNER) {
            ownerRoleId = createdRole.id;
          }
        }

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: params.name,
          phone: params.phone,
          email: params.email ?? null,
          passwordHash: params.passwordHash,
          userRoles: {
            create: {
              roleId: ownerRoleId,
            },
          },
        },
      });

      return { tenant, user };
    },
    {
      maxWait: 10000,
      timeout: 30000,
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone, isActive: true },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async updateUser(id: string, data: Partial<{ name: string; language: string; showBanglaDigits: boolean; approvalPin: string }>) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findApproversInTenant(tenantId: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        userRoles: {
          some: {
            role: {
              name: { in: ['OWNER', 'MANAGER'] },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        approvalPin: true,
      },
    });
  }

  async updateUserPassword(phone: string, passwordHash: string) {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      throw new Error('User not found');
    }
    return prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }
}



export const authRepository = new AuthRepository();
