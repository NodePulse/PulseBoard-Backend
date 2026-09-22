import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { SessionPayload } from '../auth/auth.controller';
import { SessionGuard } from 'src/core/guards/session.guard';
import { API_ROUTES } from 'src/core/constants/routes';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiEndpoint } from 'src/core/decorators/api-endpoint.decorator';
import { ResponseMessage } from 'src/core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';

@ApiTags('Subscriptions')
@Controller(API_ROUTES.SUBSCRIPTIONS.ROOT)
@UseGuards(SessionGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // CONTROLLER
  @ApiOperation({
    summary: 'Get active subscription',
    description: 'Retrieves the current active subscription for the user',
  })
  @ApiEndpoint({
    200: {
      type: Object,
      message: RESPONSE_MESSAGES.SUBSCRIPTIONS.GET_ACTIVE_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Get(API_ROUTES.SUBSCRIPTIONS.ACTIVE)
  @ResponseMessage(RESPONSE_MESSAGES.SUBSCRIPTIONS.GET_ACTIVE_SUCCESS)
  async getActiveSubscription(@CurrentUser() user: SessionPayload) {
    return this.subscriptionsService.getActiveSubscription(user.sub);
  }
}
