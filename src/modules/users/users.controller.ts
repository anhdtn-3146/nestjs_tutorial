import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('user')
  async getCurrentUser(@Req() req) {
    return await this.usersService.findById(req.user.sub);
  }

  @Put('user')
  async updateUser(@Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @Get('profiles/:id')
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findById(id, 'PROFILE');
  }
}
