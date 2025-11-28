import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureClubAccess(clubId: string | null): asserts clubId {
    if (!clubId) {
      throw new ForbiddenException('Operation requires a club context');
    }
  }

  create(clubId: string | null, dto: CreateActivityDto) {
    this.ensureClubAccess(clubId);
    return this.prisma.activity.create({
      data: {
        ...dto,
        clubId
      }
    });
  }

  findAll(clubId: string | null) {
    this.ensureClubAccess(clubId);
    return this.prisma.activity.findMany({
      where: { clubId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async update(clubId: string | null, id: string, dto: UpdateActivityDto) {
    this.ensureClubAccess(clubId);
    await this.ensureBelongsToClub(id, clubId);
    return this.prisma.activity.update({
      where: { id },
      data: dto
    });
  }

  async deactivate(clubId: string | null, id: string) {
    this.ensureClubAccess(clubId);
    await this.ensureBelongsToClub(id, clubId);
    return this.prisma.activity.update({
      where: { id },
      data: { isActive: false }
    });
  }

  private async ensureBelongsToClub(id: string, clubId: string) {
    const exists = await this.prisma.activity.count({ where: { id, clubId } });
    if (!exists) {
      throw new NotFoundException('Activity not found for this club');
    }
  }
}

