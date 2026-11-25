import { staffRepository, type StaffRepository } from './staff.repository.js';
import { prisma } from '../../config/prisma.js';
import { ForbiddenError } from '../../common/errors.js';
import { hashPassword } from '../auth/auth.password.js';
import type {
  CreateStaffInput,
  UpdateRolePermissionsInput,
} from '@dokani/shared';

export class StaffService {
  constructor(private readonly repo: StaffRepository = staffRepository) {}

  async listStaff(tenantId: string) {
    return this.repo.listStaff(tenantId);
  }

  async createStaffMember(tenantId: string, input: CreateStaffInput) {
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
    });

    const maxStaff = sub?.plan?.maxStaff ?? 1;
    if (maxStaff !== -1) {
      const currentStaffCount = await prisma.user.count({
        where: { tenantId, isActive: true },
      });

      if (currentStaffCount >= maxStaff) {
        throw new ForbiddenError(
          `Staff limit reached for your plan (${maxStaff} user max). Please upgrade to add more staff.`
        );
      }
    }

    const passwordHash = await hashPassword(input.password);
    return this.repo.createStaffMember(tenantId, {
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      passwordHash,
      roleId: input.roleId,
    });
  }

  async updateRole(tenantId: string, userId: string, roleId: string) {
    return this.repo.updateStaffRole(tenantId, userId, roleId);
  }

  async deactivateStaff(tenantId: string, userId: string) {
    return this.repo.setUserActiveStatus(tenantId, userId, false);
  }

  async reactivateStaff(tenantId: string, userId: string) {
    return this.repo.setUserActiveStatus(tenantId, userId, true);
  }

  async getRolePermissionMatrix(tenantId: string) {
    return this.repo.getRolePermissionMatrix(tenantId);
  }

  async updateRolePermissions(tenantId: string, roleId: string, input: UpdateRolePermissionsInput) {
    return this.repo.updateRolePermissions(tenantId, roleId, input.permissionIds);
  }
}

export const staffService = new StaffService();
