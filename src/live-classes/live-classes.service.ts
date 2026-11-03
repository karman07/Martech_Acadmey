import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZoomService } from '../zoom/zoom.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { UpdateLiveClassDto } from './dto/update-live-class.dto';

const WITH_LINKS = {
  courses: { select: { courseId: true } },
  bootcamps: { select: { bootcampId: true } },
};

type LiveClassWithLinks = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  dateISO: Date;
  durationMinutes: number;
  url: string;
  status: string;
  recordingUrl: string | null;
  zoomMeetingId: string | null;
  zoomStartUrl: string | null;
  createdAt: Date;
  courses: { courseId: string }[];
  bootcamps: { bootcampId: string }[];
};

@Injectable()
export class LiveClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zoom: ZoomService,
  ) {}

  private map(liveClass: LiveClassWithLinks) {
    return {
      id: liveClass.id,
      title: liveClass.title,
      description: liveClass.description,
      tags: liveClass.tags,
      dateISO: liveClass.dateISO,
      durationMinutes: liveClass.durationMinutes,
      url: liveClass.url,
      status: liveClass.status,
      recordingUrl: liveClass.recordingUrl,
      isZoomMeeting: Boolean(liveClass.zoomMeetingId),
      hostUrl: liveClass.zoomStartUrl,
      createdAt: liveClass.createdAt,
      courseIds: liveClass.courses.map((c) => c.courseId),
      bootcampIds: liveClass.bootcamps.map((b) => b.bootcampId),
    };
  }

  async findAllForTeacher(teacherUid: string) {
    const rows = await this.prisma.liveClass.findMany({
      where: { teacherUid },
      orderBy: { dateISO: 'asc' },
      include: WITH_LINKS,
    });
    return rows.map((row) => this.map(row));
  }

  async create(teacherUid: string, dto: CreateLiveClassDto) {
    const dateISO = new Date(dto.dateISO);
    const durationMinutes = dto.durationMinutes ?? 60;

    let url = dto.url?.trim() || '';
    let zoomMeetingId: string | undefined;
    let zoomStartUrl: string | undefined;

    if (dto.useZoom) {
      try {
        const meeting = await this.zoom.createMeeting(teacherUid, {
          topic: dto.title.trim(),
          startTime: dateISO,
          durationMinutes,
          agenda: dto.description,
        });
        url = meeting.joinUrl;
        zoomMeetingId = meeting.zoomMeetingId;
        zoomStartUrl = meeting.startUrl;
      } catch {
        // Zoom not configured or the API call failed — fall back to whatever the teacher
        // typed manually. Scheduling a live class must never be blocked by Zoom.
      }
    }

    if (!url) {
      throw new BadRequestException(
        'Connect your Zoom account under Profile, or paste a meeting link manually.',
      );
    }

    const liveClass = await this.prisma.liveClass.create({
      data: {
        teacherUid,
        title: dto.title.trim(),
        description: dto.description,
        tags: dto.tags ?? [],
        dateISO,
        durationMinutes,
        url,
        zoomMeetingId,
        zoomStartUrl,
      },
      include: WITH_LINKS,
    });
    return this.map(liveClass);
  }

  async update(teacherUid: string, id: string, dto: UpdateLiveClassDto) {
    const existing = await this.assertOwned(teacherUid, id);

    const nextDate = dto.dateISO ? new Date(dto.dateISO) : undefined;
    const nextDuration = dto.durationMinutes;
    const dateChanged = nextDate && nextDate.getTime() !== existing.dateISO.getTime();
    const durationChanged = nextDuration !== undefined && nextDuration !== existing.durationMinutes;

    if (existing.zoomMeetingId && (dateChanged || durationChanged || dto.title)) {
      try {
        await this.zoom.updateMeeting(teacherUid, existing.zoomMeetingId, {
          topic: dto.title?.trim(),
          startTime: nextDate,
          durationMinutes: nextDuration,
        });
      } catch {
        // Keep the local record in sync even if Zoom couldn't be updated — the join link
        // stored locally is still what students see; worst case it points at the old time.
      }
    }

    const liveClass = await this.prisma.liveClass.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        tags: dto.tags,
        dateISO: nextDate,
        durationMinutes: nextDuration,
        url: dto.url?.trim() || undefined,
      },
      include: WITH_LINKS,
    });
    return this.map(liveClass);
  }

  async remove(teacherUid: string, id: string) {
    const existing = await this.assertOwned(teacherUid, id);
    if (existing.zoomMeetingId) {
      await this.zoom.deleteMeeting(teacherUid, existing.zoomMeetingId).catch(() => {});
    }
    await this.prisma.liveClass.delete({ where: { id } });
  }

  /** Teacher/admin marks a session done and attaches where the recording lives — a pasted
   * link (Zoom Cloud, YouTube, Drive, etc.), matching how video lessons already work elsewhere
   * in this app rather than building a separate file-upload pipeline for large video files. */
  async addRecording(teacherUid: string, id: string, recordingUrl: string) {
    const existing = await this.assertOwned(teacherUid, id);
    if (existing.dateISO.getTime() > Date.now()) {
      throw new BadRequestException(
        "Can't attach a recording before the session's scheduled time has passed.",
      );
    }
    const liveClass = await this.prisma.liveClass.update({
      where: { id },
      data: { recordingUrl, status: 'completed' },
      include: WITH_LINKS,
    });
    return this.map(liveClass);
  }

  async toggleCourse(teacherUid: string, id: string, courseId: string) {
    await this.assertOwned(teacherUid, id);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.teacherUid !== teacherUid) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.courseLiveClass.findUnique({
      where: { courseId_liveClassId: { courseId, liveClassId: id } },
    });

    if (existing) {
      await this.prisma.courseLiveClass.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.courseLiveClass.create({
        data: { courseId, liveClassId: id },
      });
    }

    const liveClass = await this.prisma.liveClass.findUniqueOrThrow({
      where: { id },
      include: WITH_LINKS,
    });
    return this.map(liveClass);
  }

  async toggleBootcamp(teacherUid: string, id: string, bootcampId: string) {
    await this.assertOwned(teacherUid, id);

    const bootcamp = await this.prisma.bootcamp.findUnique({
      where: { id: bootcampId },
    });
    if (!bootcamp || bootcamp.teacherUid !== teacherUid) {
      throw new NotFoundException('Bootcamp not found');
    }

    const existing = await this.prisma.bootcampLiveClass.findUnique({
      where: { bootcampId_liveClassId: { bootcampId, liveClassId: id } },
    });

    if (existing) {
      await this.prisma.bootcampLiveClass.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.bootcampLiveClass.create({
        data: { bootcampId, liveClassId: id },
      });
    }

    const liveClass = await this.prisma.liveClass.findUniqueOrThrow({
      where: { id },
      include: WITH_LINKS,
    });
    return this.map(liveClass);
  }

  private async assertOwned(teacherUid: string, id: string) {
    const liveClass = await this.prisma.liveClass.findUnique({
      where: { id },
    });
    if (!liveClass || liveClass.teacherUid !== teacherUid) {
      throw new NotFoundException('Live class not found');
    }
    return liveClass;
  }
}
