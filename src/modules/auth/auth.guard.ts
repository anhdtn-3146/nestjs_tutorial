import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const jwtToken = token.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(jwtToken, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findById(payload.id);

      if (!user) throw new UnauthorizedException();
      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
