import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getCurrentUser(@Req() req) {
    const user = await this.usersService.findById(req.user.sub);

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
