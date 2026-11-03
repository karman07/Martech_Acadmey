import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const STATE_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

type ZoomTokens = { access_token: string; refresh_token: string; expires_in: number; scope?: string };

@Injectable()
export class ZoomService {
  constructor(private readonly prisma: PrismaService) {}

  private get clientId(): string {
    return process.env.ZOOM_CLIENT_ID || '';
  }

  private get clientSecret(): string {
    return process.env.ZOOM_CLIENT_SECRET || '';
  }

  private get redirectUri(): string {
    return process.env.ZOOM_REDIRECT_URI || '';
  }

  private get stateSecret(): string {
    return process.env.ZOOM_STATE_SECRET || '';
  }

  isAppConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri && this.stateSecret);
  }

  /** Signs `{ uid, exp }` so the OAuth callback — a route Zoom's browser redirect hits directly,
   * with no Firebase auth header available — can recover which teacher initiated the connect. */
  signState(uid: string): string {
    const payload = Buffer.from(JSON.stringify({ uid, exp: Date.now() + STATE_TTL_MS })).toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.stateSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  verifyState(state: string): string {
    const [payload, signature] = (state || '').split('.');
    if (!payload || !signature) {
      throw new BadRequestException('Invalid state');
    }
    const expected = createHmac('sha256', this.stateSecret).update(payload).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid state');
    }
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      uid: string;
      exp: number;
    };
    if (Date.now() > exp) {
      throw new BadRequestException('State expired');
    }
    return uid;
  }

  getAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://zoom.us/oauth/authorize?${params.toString()}`;
  }

  private async exchangeCode(code: string): Promise<ZoomTokens> {
    return this.requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    });
  }

  private async refreshTokens(refreshToken: string): Promise<ZoomTokens> {
    return this.requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
  }

  private async requestToken(params: Record<string, string>): Promise<ZoomTokens> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`https://zoom.us/oauth/token?${new URLSearchParams(params).toString()}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new InternalServerErrorException(`Zoom auth failed (${response.status}): ${body}`);
    }
    return response.json();
  }

  async isConnected(teacherUid: string): Promise<boolean> {
    const account = await this.prisma.teacherZoomAccount.findUnique({ where: { teacherUid } });
    return Boolean(account);
  }

  async getStatus(teacherUid: string): Promise<{ connected: boolean; email: string | null }> {
    const account = await this.prisma.teacherZoomAccount.findUnique({ where: { teacherUid } });
    return { connected: Boolean(account), email: account?.zoomEmail ?? null };
  }

  async connectTeacher(teacherUid: string, code: string): Promise<void> {
    const tokens = await this.exchangeCode(code);
    const me = await this.fetchZoomUser(tokens.access_token);

    await this.prisma.teacherZoomAccount.upsert({
      where: { teacherUid },
      create: {
        teacherUid,
        zoomUserId: me.id,
        zoomEmail: me.email ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
      update: {
        zoomUserId: me.id,
        zoomEmail: me.email ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });
  }

  async disconnectTeacher(teacherUid: string): Promise<void> {
    const account = await this.prisma.teacherZoomAccount.findUnique({ where: { teacherUid } });
    if (account) {
      await fetch('https://zoom.us/oauth/revoke', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ token: account.accessToken }).toString(),
      }).catch(() => {});
    }
    await this.prisma.teacherZoomAccount.deleteMany({ where: { teacherUid } });
  }

  /** Returns a valid access token for this teacher's own Zoom account, refreshing (and
   * persisting the rotated refresh token — Zoom rotates it on every use) if it's close to
   * expiring. Throws if the teacher hasn't connected Zoom yet. */
  private async getValidAccessToken(teacherUid: string): Promise<string> {
    const account = await this.prisma.teacherZoomAccount.findUnique({ where: { teacherUid } });
    if (!account) {
      throw new BadRequestException('Zoom is not connected for this teacher.');
    }
    if (account.expiresAt.getTime() > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
      return account.accessToken;
    }

    const tokens = await this.refreshTokens(account.refreshToken);
    await this.prisma.teacherZoomAccount.update({
      where: { teacherUid },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });
    return tokens.access_token;
  }

  private async fetchZoomUser(accessToken: string): Promise<{ id: string; email: string | null }> {
    const response = await fetch('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new InternalServerErrorException(`Zoom API error (${response.status}): ${body}`);
    }
    return response.json();
  }

  private async request<T>(teacherUid: string, path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getValidAccessToken(teacherUid);
    const response = await fetch(`https://api.zoom.us/v2${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new InternalServerErrorException(`Zoom API error (${response.status}) on ${path}: ${body}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  }

  async createMeeting(
    teacherUid: string,
    params: { topic: string; startTime: Date; durationMinutes: number; agenda?: string },
  ): Promise<{ zoomMeetingId: string; joinUrl: string; startUrl: string }> {
    const data = await this.request<{ id: number; join_url: string; start_url: string }>(
      teacherUid,
      '/users/me/meetings',
      {
        method: 'POST',
        body: JSON.stringify({
          topic: params.topic,
          type: 2, // scheduled meeting
          start_time: params.startTime.toISOString(),
          duration: params.durationMinutes,
          agenda: params.agenda?.slice(0, 2000),
          settings: { join_before_host: true, waiting_room: false },
        }),
      },
    );
    return { zoomMeetingId: String(data.id), joinUrl: data.join_url, startUrl: data.start_url };
  }

  async updateMeeting(
    teacherUid: string,
    zoomMeetingId: string,
    params: { topic?: string; startTime?: Date; durationMinutes?: number },
  ): Promise<void> {
    await this.request(teacherUid, `/meetings/${zoomMeetingId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(params.topic && { topic: params.topic }),
        ...(params.startTime && { start_time: params.startTime.toISOString() }),
        ...(params.durationMinutes && { duration: params.durationMinutes }),
      }),
    });
  }

  async deleteMeeting(teacherUid: string, zoomMeetingId: string): Promise<void> {
    await this.request(teacherUid, `/meetings/${zoomMeetingId}`, { method: 'DELETE' });
  }
}
