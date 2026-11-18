import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';
import { success } from './common/http.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  health() {
    return success(
      { name: 'Internet Billing System' },
      this.appService.getHello(),
    );
  }
}
