import { Controller, Get } from '@nestjs/common';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { success } from '../common/http.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
    return success(user, 'Profil pengguna');
  }
}
