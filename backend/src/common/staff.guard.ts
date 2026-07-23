import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Allows only MODERATOR/ADMIN users. Role is looked up from the database on
// every request (not trusted from the JWT) so demotions take effect instantly.
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Staff access required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      throw new ForbiddenException('Staff access required');
    }
    req.staffRole = user.role;
    return true;
  }
}
