import crypto from 'node:crypto';
import { staffRepository, type StaffRepository } from './staff.repository.js';
import { prisma } from '../../config/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors.js';
import { hashPassword } from '../auth/auth.password.js';
import type { AcceptInviteInput, InviteStaffInput, UpdateRolePermissionsInput } from '@dokani/shared';

export class StaffService {
  constructor(private readonly repo: StaffRepository = staffRepository) {}

  async listStaff(tenantId: string) {
    return this.repo.listStaff(tenantId);
  }

  async inviteStaff(tenantId: string, input: InviteStaffInput) {
    // Check staff count against subscription limits
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
    });

    const maxStaff = sub?.plan?.maxStaff ?? 1;
    if (maxStaff !== -1) {
      const currentStaffCount = await prisma.user.count({
        where: { tenantId, isActive: true },
      });
      const pendingInvites = await prisma.staffInvitation.count({
        where: { tenantId, status: 'PENDING' },
      });

      if (currentStaffCount + pendingInvites >= maxStaff) {
        throw new ForbiddenError(
          `Staff limit reached for your plan (${maxStaff} user max). Please upgrade to invite more staff.`
        );
      }
    }

    // Check if phone/email is already an active user in this shop
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        OR: [{ phone: input.emailOrPhone }, { email: input.emailOrPhone }],
      },
    });

    if (existingUser) {
      throw new BadRequestError('This email or phone number is already a registered staff member.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const invitation = await this.repo.createInvitation(tenantId, {
      name: input.name,
      emailOrPhone: input.emailOrPhone,
      roleId: input.roleId,
      tokenHash,
    });

    return {
      invitationId: invitation.id,
      inviteToken: rawToken,
      inviteUrl: `/accept-invite/${rawToken}`,
      name: invitation.name,
      emailOrPhone: invitation.emailOrPhone,
      role: invitation.role.name,
      expiresAt: invitation.expiresAt,
    };
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

  async getInvitationDetails(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const inv = await this.repo.findInvitationByTokenHash(tokenHash);

    if (!inv) {
      throw new NotFoundError('Invitation link is invalid.');
    }
    if (inv.status !== 'PENDING') {
      throw new BadRequestError('This invitation has already been used or cancelled.');
    }
    if (inv.expiresAt < new Date()) {
      throw new BadRequestError('This invitation link has expired.');
    }

    const isPhoneInvite = /^01[3-9]\d{8}$/.test(inv.emailOrPhone);
    return {
      name: inv.name,
      emailOrPhone: inv.emailOrPhone,
      requiresPhoneInput: !isPhoneInvite,
      roleName: inv.role.name,
      tenantName: inv.tenant.name,
      tenantLogoUrl: inv.tenant.logoUrl,
      expiresAt: inv.expiresAt,
    };
  }

  async acceptInvitation(rawToken: string, input: AcceptInviteInput) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const inv = await this.repo.findInvitationByTokenHash(tokenHash);

    if (!inv) {
      throw new NotFoundError('Invitation link is invalid.');
    }
    if (inv.status !== 'PENDING') {
      throw new BadRequestError('This invitation has already been used or cancelled.');
    }
    if (inv.expiresAt < new Date()) {
      throw new BadRequestError('This invitation link has expired.');
    }

    const isPhoneInvite = /^01[3-9]\d{8}$/.test(inv.emailOrPhone);
    const phone = isPhoneInvite ? inv.emailOrPhone : input.phone?.trim();

    if (!phone) {
      throw new BadRequestError('Bangladeshi mobile number is required to activate your login.');
    }

    const email = inv.emailOrPhone.includes('@') ? inv.emailOrPhone : null;
    const passwordHash = await hashPassword(input.password);

    const user = await this.repo.acceptInvitation({
      invitationId: inv.id,
      tenantId: inv.tenantId,
      roleId: inv.roleId,
      name: inv.name,
      phone,
      email,
      passwordHash,
    });

    return {
      user,
      roleName: inv.role.name,
      tenantName: inv.tenant.name,
    };
  }
}

export const staffService = new StaffService();
