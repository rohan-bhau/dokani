import { Permission, SystemRole } from '@dokani/shared';
import type { Tenant, User } from '@prisma/client';
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
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: params.tenantName,
          slug: params.slug,
          phone: params.phone,
        },
      });

      // Ensure system permissions exist
      const permissionCodes = Object.values(Permission);
      for (const code of permissionCodes) {
        await tx.permission.upsert({
          where: { code },
          update: {},
          create: { code, description: code },
        });
      }

      const allPermissions = await tx.permission.findMany({
        select: { id: true },
      });

      // Create owner role for this tenant
      const ownerRole = await tx.role.create({
        data: {
          name: SystemRole.OWNER,
          tenantId: tenant.id,
          isSystem: true,
          rolePermissions: {
            create: allPermissions.map((perm) => ({
              permissionId: perm.id,
            })),
          },
        },
      });

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
              roleId: ownerRole.id,
            },
          },
        },
      });

      return { tenant, user };
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
}

export const authRepository = new AuthRepository();
