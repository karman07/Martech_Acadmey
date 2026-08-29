import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthedRequest } from './firebase-auth.guard';

/** The DB `User` row for the caller — only populated on routes guarded by `RolesGuard`. */
export const CurrentProfile = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthedRequest>();
    return request.profile;
  },
);
