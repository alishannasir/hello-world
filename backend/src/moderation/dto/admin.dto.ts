import { IsEnum } from 'class-validator';
import { ReportStatus, UserStatus } from '@prisma/client';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
