import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('user')
export class UsersController {
  @Get()
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req) {
    return req.user;
  }
}
