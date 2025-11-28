import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateClassDto, RecurrenceMode } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';
import { ListOccurrencesDto } from './dto/list-occurrences.dto';

const MAX_INDEFINITE_WEEKS = 12;

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateClassDto) {
    const clubId = this.requireClubId(user.clubId);

    await Promise.all([
      this.ensureActivityInClub(dto.activityId, clubId),
      this.ensureBranchInClub(dto.branchId, clubId),
      this.ensureTeacherInClub(dto.teacherId, clubId)
    ]);

    const createdClass = await this.prisma.class.create({
      data: {
        clubId,
        branchId: dto.branchId,
        activityId: dto.activityId,
        teacherId: dto.teacherId,
        name: dto.name,
        description: dto.description ?? null,
        classType: dto.type,
        level: dto.level ?? null,
        capacity: dto.maxStudents,
        reservationModeAdminOnly: dto.reservationModeAdminOnly ?? false
      }
    });

    const occurrences = await this.generateOccurrences(createdClass.id, clubId, dto);

    return {
      class: createdClass,
      occurrencesCreated: occurrences.length
    };
  }

  async list(user: AuthUser, filters: ListClassesDto) {
    const clubId = this.requireClubId(user.clubId);
    return this.prisma.class.findMany({
      where: {
        clubId,
        isActive: true,
        activityId: filters.activityId,
        branchId: filters.branchId,
        teacherId: filters.teacherId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(user: AuthUser, id: string) {
    const clubId = this.requireClubId(user.clubId);

    const klass = await this.prisma.class.findFirst({
      where: { id, clubId },
      include: {
        occurrences: {
          where: { startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' }
        }
      }
    });

    if (!klass) {
      throw new NotFoundException('Class not found for this club');
    }

    return klass;
  }

  async update(user: AuthUser, id: string, dto: UpdateClassDto) {
    const clubId = this.requireClubId(user.clubId);
    await this.ensureClassInClub(id, clubId);

    if (dto.activityId) {
      await this.ensureActivityInClub(dto.activityId, clubId);
    }

    if (dto.branchId) {
      await this.ensureBranchInClub(dto.branchId, clubId);
    }

    if (dto.teacherId) {
      await this.ensureTeacherInClub(dto.teacherId, clubId);
    }

    // TODO(negocio): Si se modifican horarios/días, regenerar occurrences futuras respetando reservas existentes.
    const data: Prisma.ClassUpdateInput = {
      name: dto.name,
      description: dto.description,
      level: dto.level
    };

    if (dto.activityId) {
      data.activity = { connect: { id: dto.activityId } };
    }

    if (dto.branchId) {
      data.branch = { connect: { id: dto.branchId } };
    }

    if (dto.teacherId) {
      data.teacher = { connect: { id: dto.teacherId } };
    }

    if (dto.type) {
      data.classType = dto.type;
    }

    if (dto.maxStudents !== undefined) {
      data.capacity = dto.maxStudents;
    }

    if (dto.reservationModeAdminOnly !== undefined) {
      data.reservationModeAdminOnly = dto.reservationModeAdminOnly;
    }

    return this.prisma.class.update({
      where: { id },
      data
    });
  }

  async deactivate(user: AuthUser, id: string) {
    const clubId = this.requireClubId(user.clubId);
    await this.ensureClassInClub(id, clubId);
    return this.prisma.class.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async listOccurrences(user: AuthUser, filters: ListOccurrencesDto) {
    const clubId = this.requireClubId(user.clubId);

    const where: Prisma.ClassOccurrenceWhereInput = {
      clubId
    };

    if (filters.teacherId || filters.activityId) {
      where.class = {
        is: {
          ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
          ...(filters.activityId ? { activityId: filters.activityId } : {})
        }
      };
    }

    if (filters.startDate || filters.endDate) {
      where.startsAt = {
        gte: filters.startDate ? new Date(filters.startDate) : undefined,
        lte: filters.endDate ? new Date(filters.endDate) : undefined
      };
    } else {
      where.startsAt = { gte: new Date() };
    }

    return this.prisma.classOccurrence.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            teacherId: true,
            activityId: true
          }
        }
      },
      orderBy: { startsAt: 'asc' }
    });
  }

  private requireClubId(clubId: string | null): string {
    if (!clubId) {
      throw new ForbiddenException('Operation requires a club context');
    }
    return clubId;
  }

  private async ensureClassInClub(classId: string, clubId: string) {
    const exists = await this.prisma.class.count({ where: { id: classId, clubId } });
    if (!exists) {
      throw new NotFoundException('Class not found for this club');
    }
  }

  private async ensureActivityInClub(activityId: string, clubId: string) {
    const exists = await this.prisma.activity.count({ where: { id: activityId, clubId, isActive: true } });
    if (!exists) {
      throw new NotFoundException('Activity not found for this club');
    }
  }

  private async ensureBranchInClub(branchId: string, clubId: string) {
    const exists = await this.prisma.branch.count({ where: { id: branchId, clubId, isActive: true } });
    if (!exists) {
      throw new NotFoundException('Branch not found for this club');
    }
  }

  private async ensureTeacherInClub(teacherId: string, clubId: string) {
    const exists = await this.prisma.user.count({
      where: { id: teacherId, clubId, role: UserRole.TEACHER, active: true }
    });
    if (!exists) {
      throw new NotFoundException('Teacher not found for this club');
    }
  }

  private async generateOccurrences(classId: string, clubId: string, dto: CreateClassDto) {
    if (dto.mode === RecurrenceMode.SINGLE) {
      const singleSchedule = dto.single;
      if (!singleSchedule) {
        throw new BadRequestException('single schedule is required for SINGLE mode');
      }
      const date = new Date(singleSchedule.date);
      const { startTime, endTime } = singleSchedule;
      const { startsAt, endsAt } = this.composeDateRange(date, startTime, endTime);
      return this.prisma.classOccurrence.createMany({
        data: [
          {
            classId,
            clubId,
            startsAt,
            endsAt,
            capacity: dto.maxStudents
          }
        ]
      }).then(() => [{ startsAt, endsAt }]);
    }

    const recurringSchedule = dto.recurring;
    if (!recurringSchedule) {
      throw new BadRequestException('recurring schedule is required for RECURRING mode');
    }

    const occurrencesToCreate: { startsAt: Date; endsAt: Date }[] = [];

    const startDate = new Date(recurringSchedule.startDate);
    const endDate = recurringSchedule.endDate ? new Date(recurringSchedule.endDate) : null;

    if (endDate && this.isBefore(endDate, startDate)) {
      throw new BadRequestException('endDate must be greater than startDate');
    }

    const daysOfWeek = recurringSchedule.daysOfWeek;
    let cursor = new Date(startDate);
    const limit = endDate ?? this.addWeeks(startDate, MAX_INDEFINITE_WEEKS);

    while (this.isBefore(cursor, limit) || this.isEqual(cursor, limit)) {
      const dayOfWeek = cursor.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        const { startsAt, endsAt } = this.composeDateRange(cursor, recurringSchedule.startTime, recurringSchedule.endTime);
        occurrencesToCreate.push({ startsAt, endsAt });
      }
      cursor = this.addDays(cursor, 1);
      if (!endDate && occurrencesToCreate.length >= daysOfWeek.length * MAX_INDEFINITE_WEEKS) {
        break;
      }
    }

    if (occurrencesToCreate.length === 0) {
      throw new BadRequestException('No occurrences generated with provided schedule');
    }

    await this.prisma.classOccurrence.createMany({
      data: occurrencesToCreate.map((occ) => ({
        classId,
        clubId,
        startsAt: occ.startsAt,
        endsAt: occ.endsAt,
        capacity: dto.maxStudents
      }))
    });

    // TODO(negocio): Para recurrencias sin endDate, generar occurrences progresivamente (jobs) para evitar tablas enormes.
    return occurrencesToCreate;
  }

  private composeDateRange(baseDate: Date, startTime: string, endTime: string) {
    const startsAt = this.combineDateAndTime(baseDate, startTime);
    const endsAt = this.combineDateAndTime(baseDate, endTime);
    if (this.isBefore(endsAt, startsAt) || this.isEqual(endsAt, startsAt)) {
      throw new BadRequestException('endTime must be later than startTime');
    }
    return { startsAt, endsAt };
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hoursPart, minutesPart] = time.split(':');
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new BadRequestException('Invalid time format, expected HH:mm');
    }
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private addWeeks(date: Date, weeks: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime();
  }

  private isEqual(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
  }
}

