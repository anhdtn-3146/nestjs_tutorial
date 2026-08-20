import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AccessTokenPayload } from 'src/modules/auth/auth.types';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('user')
  async getCurrentUser(@CurrentUser() user: AccessTokenPayload) {
    return await this.usersService.findById(user.sub);
  }

  @Put('user')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.usersService.update(user.sub, updateUserDto);
  }

  @Get('profiles/:id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findById(id, 'PROFILE');
  }
}
