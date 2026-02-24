import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserSerializer } from './serializers/user.serializer';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getCurrentUser(@Req() req) {
    const user = await this.usersService.findById(req.user.sub);

    return new UserSerializer(user, { type: 'BASIC_INFO' }).serialize();
  }
}
