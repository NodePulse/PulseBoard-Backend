import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { SessionPayload } from '../auth/auth.controller';
import { SessionGuard } from 'src/core/guards/session.guard';

@Controller('subscriptions')
@UseGuards(SessionGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('active')
  async getActiveSubscription(@CurrentUser() user: SessionPayload) {
    return this.subscriptionsService.getActiveSubscription(user.sub);
  }
}
