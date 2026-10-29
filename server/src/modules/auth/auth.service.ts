import crypto from 'node:crypto';
import type { LoginInput, SignupInput } from '@dokani/shared';
import { ConflictError, UnauthorizedError } from '../../common/errors.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth.jwt.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import { authRepository, type AuthRepository } from './auth.repository.js';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
    roles: string[];
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RequestMetadata {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async signup(input: SignupInput, metadata?: RequestMetadata): Promise<AuthResponse> {
    const existing = await this.repo.findUserByPhone(input.phone);
    if (existing) {
      throw new ConflictError('A user with this phone number already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    const baseSlug = input.tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug || 'shop'}-${crypto.randomBytes(3).toString('hex')}`;

    const { tenant, user } = await this.repo.createTenantAndOwner({
      tenantName: input.tenantName,
      slug,
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
    });

    const fullUser = await this.repo.findUserById(user.id);
    if (!fullUser) {
      throw new UnauthorizedError('User initialization failed.');
    }

    const { permissions, roles } = this.extractRolesAndPermissions(fullUser);

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      permissions,
    });

    const tokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(input: LoginInput, metadata?: RequestMetadata): Promise<AuthResponse> {
    const user = await this.repo.findUserByPhone(input.phone);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const { permissions, roles } = this.extractRolesAndPermissions(user);

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      permissions,
    });

    const tokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ userId: user.id, tokenId });

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        },
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(token: string, metadata?: RequestMetadata) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const hashed = hashToken(token);
    const existing = await this.repo.findRefreshToken(hashed);

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or has been revoked.');
    }

    // Rotate token
    await this.repo.revokeRefreshToken(existing.id);

    const user = await this.repo.findUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is inactive or not found.');
    }

    const { permissions } = this.extractRolesAndPermissions(user);

    const newAccessToken = signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      permissions,
    });

    const newRefreshToken = signRefreshToken({ userId: user.id, tokenId: crypto.randomUUID() });

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    try {
      const hashed = hashToken(token);
      const existing = await this.repo.findRefreshToken(hashed);
      if (existing) {
        await this.repo.revokeRefreshToken(existing.id);
      }
    } catch {
      // Logout is idempotent, ignore invalid token formats
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractRolesAndPermissions(user: any) {
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const userRole of user.userRoles) {
      roles.push(userRole.role.name);
      for (const rolePerm of userRole.role.rolePermissions) {
        permissionsSet.add(rolePerm.permission.code);
      }
    }

    return {
      roles,
      permissions: Array.from(permissionsSet),
    };
  }
}

export const authService = new AuthService();
