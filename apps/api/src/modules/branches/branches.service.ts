import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureClubAccess(clubId: string | null): asserts clubId {
    if (!clubId) {
      throw new ForbiddenException('Operation requires a club context');
    }
  }

  create(clubId: string | null, dto: CreateBranchDto) {
    this.ensureClubAccess(clubId);
    return this.prisma.branch.create({
      data: {
        ...dto,
        clubId
      }
    });
  }

  findAll(clubId: string | null) {
    this.ensureClubAccess(clubId);
    return this.prisma.branch.findMany({
      where: { clubId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(clubId: string | null, id: string, dto: UpdateBranchDto) {
    this.ensureClubAccess(clubId);
    await this.ensureBelongsToClub(id, clubId);
    return this.prisma.branch.update({
      where: { id },
      data: dto
    });
  }

  async deactivate(clubId: string | null, id: string) {
    this.ensureClubAccess(clubId);
    await this.ensureBelongsToClub(id, clubId);
    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });
  }

  private async ensureBelongsToClub(id: string, clubId: string) {
    const exists = await this.prisma.branch.count({ where: { id, clubId } });
    if (!exists) {
      throw new NotFoundException('Branch not found for this club');
    }
  }
}

