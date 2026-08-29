import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import type { AuthedRequest } from './firebase-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const profile = await this.prisma.user.findUnique({
      where: { uid: request.user.uid },
      include: { kyc: true },
    });

    if (!profile || !requiredRoles.includes(profile.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (profile.role === 'teacher' && profile.kyc?.status !== 'approved') {
      throw new ForbiddenException({
        code: 'KYC_NOT_APPROVED',
        message: 'Your identity verification must be approved before you can do this.',
      });
    }

    request.profile = profile;
    return true;
  }
}
