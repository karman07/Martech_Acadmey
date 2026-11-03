import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ZoomService } from './zoom.service';

/** The one intentionally public route in this backend: Zoom's browser redirect lands here
 * directly after the teacher approves the consent screen, so it can't carry a Firebase auth
 * header. The signed `state` param (see ZoomService.signState/verifyState) is what ties this
 * request back to the teacher who initiated the connect. */
@Controller('zoom/oauth')
export class ZoomOAuthController {
  constructor(private readonly zoom: ZoomService) {}

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    const redirectBase = `${process.env.FRONTEND_ORIGIN}/teacher-dashboard/profile`;
    try {
      if (!code || !state) throw new Error('Missing code or state');
      const teacherUid = this.zoom.verifyState(state);
      await this.zoom.connectTeacher(teacherUid, code);
      res.redirect(`${redirectBase}?zoom=connected`);
    } catch {
      res.redirect(`${redirectBase}?zoom=error`);
    }
  }
}
