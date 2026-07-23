import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FramesController } from './frames.controller';
import { ContentModerationService } from './content-moderation.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StaffGuard } from '../common/staff.guard';

@Module({
  controllers: [ReportsController, FramesController, AdminController],
  providers: [ReportsService, ContentModerationService, AdminService, StaffGuard],
})
export class ModerationModule {}
