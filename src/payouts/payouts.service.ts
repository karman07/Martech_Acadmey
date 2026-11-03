import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import type { PayoutStatus } from '@prisma/client';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  findForTeacher(teacherUid: string) {
    return this.prisma.payout.findMany({
      where: { teacherUid },
      orderBy: { dateISO: 'desc' },
    });
  }

  findAll(teacherUid?: string) {
    return this.prisma.payout.findMany({
      where: teacherUid ? { teacherUid } : undefined,
      include: { teacher: { select: { name: true, email: true } } },
      orderBy: { dateISO: 'desc' },
    });
  }

  create(dto: CreatePayoutDto) {
    return this.prisma.payout.create({
      data: { ...dto, dateISO: new Date(dto.dateISO) },
    });
  }

  /** Used by PaymentsService to auto-record the outcome of a Route transfer attempt —
   * unlike create() (the admin-facing manual entry form), this sets status/note directly
   * rather than always defaulting to "pending". */
  createAutomatic(data: {
    teacherUid: string;
    periodLabel: string;
    amount: number;
    status: PayoutStatus;
    method: string;
    note?: string;
  }) {
    return this.prisma.payout.create({
      data: { ...data, dateISO: new Date() },
    });
  }

  async updateStatus(id: string, dto: UpdatePayoutStatusDto) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) {
      throw new NotFoundException('Payout not found');
    }
    return this.prisma.payout.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
