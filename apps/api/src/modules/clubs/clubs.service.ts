import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClubDto) {
    return this.prisma.club.create({
      data: dto
    });
  }

  findAll() {
    return this.prisma.club.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException('Club not found');
    }
    return club;
  }

  async update(id: string, dto: UpdateClubDto) {
    await this.ensureExists(id);
    return this.prisma.club.update({
      where: { id },
      data: dto as Prisma.ClubUpdateInput
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.club.count({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Club not found');
    }
  }
}

