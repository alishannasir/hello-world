import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { StaffGuard } from '../common/staff.guard';
import { UpdateReportStatusDto, UpdateUserStatusDto } from './dto/admin.dto';

// Internal moderation queue API. JWT + staff role required for every route.
@Controller('admin')
@UseGuards(AuthGuard('jwt'), StaffGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('reports')
  reports(@Query('status') status?: string) {
    const valid =
      status && (Object.values(ReportStatus) as string[]).includes(status)
        ? (status as ReportStatus)
        : undefined;
    return this.admin.listReports(valid);
  }

  @Patch('reports/:id')
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.admin.updateReport(id, dto.status);
  }

  @Patch('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @Get('scans')
  scans(@Query('reviewed') reviewed?: string) {
    return this.admin.listScans(reviewed === 'true');
  }

  @Patch('scans/:id/reviewed')
  markReviewed(@Param('id') id: string) {
    return this.admin.markScanReviewed(id);
  }
}
