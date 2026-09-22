import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from 'src/core/guards/session.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/createPaymentOrder.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import type { SessionPayload } from '../auth/auth.controller';
import { CompletePaymentOrderDto } from './dto/completePaymentOrder.dto';
import { API_ROUTES } from 'src/core/constants/routes';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApiEndpoint } from 'src/core/decorators/api-endpoint.decorator';
import { ResponseMessage } from 'src/core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';

@ApiTags('Payments')
@Controller(API_ROUTES.PAYMENTS.ROOT)
@UseGuards(SessionGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // CONTROLLER
  @ApiOperation({
    summary: 'Create payment order',
    description: 'Creates a new payment order for a subscription plan',
  })
  @ApiBody({ type: CreatePaymentOrderDto })
  @ApiEndpoint({
    201: {
      type: Object,
      message: RESPONSE_MESSAGES.PAYMENTS.CREATE_ORDER_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.PAYMENTS.CREATE_PAYMENT_ORDER)
  @ResponseMessage(RESPONSE_MESSAGES.PAYMENTS.CREATE_ORDER_SUCCESS)
  public async createPaymentOrder(
    @Body() createPaymentOrderDto: CreatePaymentOrderDto,
    @CurrentUser() user: SessionPayload,
  ) {
    return this.paymentsService.createPaymentOrder(
      createPaymentOrderDto,
      user.sub,
    );
  }

  // CONTROLLER
  @ApiOperation({
    summary: 'Complete payment order',
    description: 'Completes an existing payment order',
  })
  @ApiBody({ type: CompletePaymentOrderDto })
  @ApiEndpoint({
    201: {
      type: Object,
      message: RESPONSE_MESSAGES.PAYMENTS.COMPLETE_ORDER_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.PAYMENTS.COMPLETE_PAYMENT_ORDER)
  @ResponseMessage(RESPONSE_MESSAGES.PAYMENTS.COMPLETE_ORDER_SUCCESS)
  public async completePaymentOrder(
    @Body() completePaymentOrderDto: CompletePaymentOrderDto,
  ) {
    return this.paymentsService.completePaymentOrder(completePaymentOrderDto);
  }
}
