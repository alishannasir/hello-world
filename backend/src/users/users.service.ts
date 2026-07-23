import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export const MAX_GENDER_CHANGES = 3;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize(user: User) {
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new NotFoundException('User not found');

    let birthdate: Date | undefined;
    if (dto.birthdate) {
      birthdate = new Date(dto.birthdate);
      AuthService.assertAdult(birthdate); // server-side 18+ gate, also for OAuth signups
    }

    const data: Prisma.UserUpdateInput = {
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      birthdate,
      country: dto.country ? dto.country.toUpperCase() : undefined,
    };

    // Gender may change at most MAX_GENDER_CHANGES times total, ever.
    // The initial set (from null) is free and not counted.
    if (dto.gender && dto.gender !== current.gender) {
      if (current.gender !== null && current.genderChangeCount >= MAX_GENDER_CHANGES) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'GENDER_CHANGE_LIMIT',
          message: `You have used all ${MAX_GENDER_CHANGES} gender changes on this account.`,
        });
      }
      data.gender = dto.gender;
      if (current.gender !== null) data.genderChangeCount = { increment: 1 };
    }

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return this.sanitize(user);
  }

  /** Cursor-paginated match history from the sessions table, most recent first. */
  async history(userId: string, cursor?: string, limitRaw?: number) {
    const take = Math.min(Math.max(limitRaw ?? 20, 1), 50);
    const sessions = await this.prisma.callSession.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { startedAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { userA: true, userB: true },
    });

    const hasMore = sessions.length > take;
    const page = sessions.slice(0, take);

    // Friend status per peer so the client can offer an inline Add Friend action.
    const peerIds = [...new Set(page.map((s) => (s.userAId === userId ? s.userBId : s.userAId)))];
    const friendRows = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userAId: userId, userBId: { in: peerIds } },
          { userBId: userId, userAId: { in: peerIds } },
        ],
      },
    });
    const friendStatus = new Map<string, string>();
    for (const row of friendRows) {
      friendStatus.set(row.userAId === userId ? row.userBId : row.userAId, row.status);
    }

    const items = page.map((s) => {
      const peer = s.userAId === userId ? s.userB : s.userA;
      return {
        sessionId: s.id,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds: s.endedAt
          ? Math.max(0, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000))
          : null,
        peer: {
          userId: peer.id,
          displayName: peer.displayName,
          avatarUrl: peer.avatarUrl,
          country: peer.country,
        },
        friendStatus: friendStatus.get(peer.id) ?? null,
      };
    });

    return { items, nextCursor: hasMore ? page[page.length - 1].id : null };
  }
}
