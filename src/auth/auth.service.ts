import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(password: string): Promise<{ accessToken: string }> {
    const hash = this.config.get<string>('ADMIN_PASSWORD_HASH');
    const valid = hash ? await compare(password, hash) : false;

    if (!valid) throw new UnauthorizedException('Неверный пароль');

    const accessToken = await this.jwtService.signAsync({ role: 'admin' });
    return { accessToken };
  }
}
