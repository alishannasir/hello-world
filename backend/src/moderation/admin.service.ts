import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { id: true, displayName: true, email: true } },
        reported: { select: { id: true, displayName: true, email: true, status: true } },
      },
    });
  }

  async updateReport(id: string, status: ReportStatus) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({ where: { id }, data: { status } });
  }

  async setUserStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  listScans(reviewed: boolean) {
    return this.prisma.moderationScan.findMany({
      where: { reviewed },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, displayName: true, email: true, status: true } },
      },
    });
  }

  async markScanReviewed(id: string) {
    const scan = await this.prisma.moderationScan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException('Scan not found');
    return this.prisma.moderationScan.update({ where: { id }, data: { reviewed: true } });
  }
}
