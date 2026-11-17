import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { success } from '../common/http.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return success(data, 'Registrasi berhasil');
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return success(data, 'Login berhasil');
  }
}
