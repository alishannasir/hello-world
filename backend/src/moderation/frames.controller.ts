import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentModerationService } from './content-moderation.service';
import { ScanFrameDto } from './dto/scan-frame.dto';

interface AuthedRequest {
  user: { userId: string; email: string };
}

// Clients periodically POST downscaled frames of their OWN local video here,
// so every published stream gets sampled by the moderation provider.
@Controller('moderation')
@UseGuards(AuthGuard('jwt'))
export class FramesController {
  constructor(private readonly moderation: ContentModerationService) {}

  @Post('frames')
  scan(@Req() req: AuthedRequest, @Body() dto: ScanFrameDto) {
    return this.moderation.scanFrame(req.user.userId, dto.sessionId, dto.frame);
  }
}
