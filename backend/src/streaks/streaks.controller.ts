import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StreaksService } from './streaks.service';

interface AuthedRequest {
  user: { userId: string; email: string };
}

@Controller('streaks')
@UseGuards(AuthGuard('jwt'))
export class StreaksController {
  constructor(private readonly streaks: StreaksService) {}

  @Get('me')
  me(@Req() req: AuthedRequest) {
    return this.streaks.getStatus(req.user.userId);
  }
}
