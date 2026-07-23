import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface AuthedRequest {
  user: { userId: string; email: string };
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: AuthedRequest) {
    return this.users.findMe(req.user.userId);
  }

  @Get('me/history')
  history(
    @Req() req: AuthedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.history(req.user.userId, cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Patch('me')
  update(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }
}
