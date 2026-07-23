import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RoomServiceClient } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

interface ProviderVerdict {
  flagged: boolean;
  label?: string;
  score?: number;
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get enabled(): boolean {
    return Boolean(process.env.MODERATION_API_URL);
  }

  async scanFrame(userId: string, sessionId: string, frameBase64: string) {
    // No provider configured (e.g. local dev): accept and no-op.
    if (!this.enabled) return { flagged: false, enabled: false };

    const session = await this.prisma.callSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userAId !== userId && session.userBId !== userId) {
      throw new ForbiddenException('Not a participant of this session');
    }

    const verdict = await this.callProvider(frameBase64);
    if (!verdict.flagged) return { flagged: false };

    const terminateAt = parseFloat(process.env.MODERATION_TERMINATE_THRESHOLD ?? '0.85');
    const score = verdict.score ?? 1;
    const label = (verdict.label ?? 'UNKNOWN').toUpperCase();
    // Critical labels always escalate regardless of score.
    const critical = label.includes('MINOR') || label.includes('CSAM');
    const shouldTerminate = critical || score >= terminateAt;

    await this.prisma.moderationScan.create({
      data: {
        userId,
        sessionId,
        provider: process.env.MODERATION_PROVIDER ?? 'http',
        label,
        score,
        action: critical ? 'ESCALATED' : shouldTerminate ? 'TERMINATED' : 'FLAGGED',
      },
    });

    if (shouldTerminate) {
      if (session.roomId) await this.terminateRoom(session.roomId);
      await this.prisma.callSession
        .update({ where: { id: sessionId }, data: { endedAt: new Date() } })
        .catch(() => undefined);
    }

    if (critical) {
      // Escalation path: suspend immediately pending human review in /admin.
      await this.prisma.user.updateMany({
        where: { id: userId, status: 'ACTIVE' },
        data: { status: 'SUSPENDED' },
      });
      this.logger.warn(`Escalated moderation scan for user ${userId} (label=${label})`);
    }

    return { flagged: true };
  }

  /**
   * Adapter for the moderation provider (Hive, an AWS Rekognition proxy, etc).
   * Contract: the endpoint accepts { image: <base64 jpeg> } and returns
   * { flagged: boolean, label?: string, score?: number }.
   * Map vendor-specific request/response shapes inside this method only.
   */
  private async callProvider(frameBase64: string): Promise<ProviderVerdict> {
    try {
      const res = await fetch(process.env.MODERATION_API_URL as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MODERATION_API_KEY
            ? { Authorization: `Bearer ${process.env.MODERATION_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({ image: frameBase64 }),
      });
      if (!res.ok) throw new Error(`Provider returned ${res.status}`);
      return (await res.json()) as ProviderVerdict;
    } catch (err) {
      // Fail-open so provider outages never take calls down, but log loudly;
      // hook alerting here in production.
      this.logger.error(`Moderation provider call failed: ${(err as Error).message}`);
      return { flagged: false };
    }
  }

  private async terminateRoom(roomName: string) {
    try {
      const httpUrl = (process.env.LIVEKIT_URL ?? '').replace(/^ws/, 'http');
      const client = new RoomServiceClient(
        httpUrl,
        process.env.LIVEKIT_API_KEY ?? '',
        process.env.LIVEKIT_API_SECRET ?? '',
      );
      await client.deleteRoom(roomName);
    } catch (err) {
      this.logger.error(`Failed to terminate room ${roomName}: ${(err as Error).message}`);
    }
  }
}
