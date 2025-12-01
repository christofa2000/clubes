import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import type { CurrentUser } from '../common/interfaces/auth-user.interface';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClubDto) {
    return this.prisma.club.create({ data: dto });
  }

  findAll() {
    return this.prisma.club.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException('CLUB_NOT_FOUND');
    }
    return club;
  }

  async getClubForUser(currentUser: CurrentUser, clubIdOverride?: string) {
    if (currentUser.role === 'SUPER_ADMIN') {
      const targetId = clubIdOverride;
      if (!targetId) {
        throw new BadRequestException('CLUB_ID_REQUIRED');
      }
      return this.findById(targetId);
    }

    if (!currentUser.clubId) {
      throw new NotFoundException('CLUB_NOT_ASSIGNED');
    }

    return this.findById(currentUser.clubId);
  }

  async updateMyClub(currentUser: CurrentUser, dto: UpdateClubDto) {
    const clubId = currentUser.clubId;
    if (!clubId) {
      throw new NotFoundException('CLUB_NOT_FOUND');
    }

    await this.ensureExists(clubId);

    return this.prisma.club.update({
      where: { id: clubId },
      data: dto,
    });
  }

  async deleteClub(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!club) {
      throw new NotFoundException('CLUB_NOT_FOUND');
    }

    if (!club.isActive || club.deletedAt) {
      throw new BadRequestException('CLUB_ALREADY_DELETED');
    }

    return this.prisma.club.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.club.count({ where: { id } });
    if (!exists) {
      throw new NotFoundException('CLUB_NOT_FOUND');
    }
  }
}








