import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from 'src/core/guards/session.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/createPaymentOrder.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import type { SessionPayload } from '../auth/auth.controller';
import { CompletePaymentOrderDto } from './dto/completePaymentOrder.dto';

@Controller('payments')
@UseGuards(SessionGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-order')
  public async createPaymentOrder(
    @Body() createPaymentOrderDto: CreatePaymentOrderDto,
    @CurrentUser() user: SessionPayload,
  ) {
    return this.paymentsService.createPaymentOrder(
      createPaymentOrderDto,
      user.sub,
    );
  }

  @Post('complete-payment-order')
  public async completePaymentOrder(
    @Body() completePaymentOrderDto: CompletePaymentOrderDto,
  ) {
    return this.paymentsService.completePaymentOrder(completePaymentOrderDto);
  }
}
