import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureClubAccess(clubId: string | null): asserts clubId is string {
    if (!clubId) {
      throw new ForbiddenException('Operation requires a club context');
    }
  }

  async create(clubId: string | null, dto: CreatePlanDto) {
    this.ensureClubAccess(clubId);
    await this.ensureActivityBelongsToClub(dto.activityId, clubId);

    return this.prisma.plan.create({
      data: {
        clubId,
        activityId: dto.activityId,
        name: dto.name,
        type: dto.type,
        price: new Prisma.Decimal(dto.price),
        classesPerWeek: dto.classesPerWeek ?? null,
        description: dto.description
      }
    });
  }

  findAll(clubId: string | null) {
    this.ensureClubAccess(clubId);
    return this.prisma.plan.findMany({
      where: { clubId, isActive: true },
      include: { activity: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(clubId: string | null, id: string) {
    this.ensureClubAccess(clubId);
    const plan = await this.prisma.plan.findFirst({
      where: { id, clubId },
      include: { activity: true }
    });
    if (!plan) {
      throw new NotFoundException('Plan not found for this club');
    }
    return plan;
  }

  async update(clubId: string | null, id: string, dto: UpdatePlanDto) {
    this.ensureClubAccess(clubId);
    await this.ensurePlanBelongsToClub(id, clubId);

    if (dto.activityId) {
      await this.ensureActivityBelongsToClub(dto.activityId, clubId);
    }

    return this.prisma.plan.update({
      where: { id },
      data: {
        ...dto,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined
      }
    });
  }

  async deactivate(clubId: string | null, id: string) {
    this.ensureClubAccess(clubId);
    await this.ensurePlanBelongsToClub(id, clubId);
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });
  }

  private async ensurePlanBelongsToClub(id: string, clubId: string) {
    const exists = await this.prisma.plan.count({ where: { id, clubId } });
    if (!exists) {
      throw new NotFoundException('Plan not found for this club');
    }
  }

  private async ensureActivityBelongsToClub(activityId: string, clubId: string) {
    const exists = await this.prisma.activity.count({ where: { id: activityId, clubId } });
    if (!exists) {
      throw new NotFoundException('Activity not found for this club');
    }
  }
}











