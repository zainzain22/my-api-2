import { Controller, Get } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
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

  @Roles(Role.ADMIN)
  @Get()
  async findCustomers() {
    const data = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        subscriptions: {
          include: { service_provider: true },
          orderBy: { registered_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return success(data, 'Daftar customer beserta layanan');
  }
}
