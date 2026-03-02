import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() createCheckoutDto: CreateCheckoutSessionDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.paymentsService.createCheckoutSession(
      createCheckoutDto,
      user.id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Checkout session created successfully',
      data: result,
    };
  }

  @Get('session/:sessionId')
  async getCheckoutSession(@Param('sessionId') sessionId: string) {
    const session = await this.paymentsService.getCheckoutSession(sessionId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Checkout session retrieved successfully',
      data: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      },
    };
  }

  @Post('handle-success')
  async handleSuccessfulPayment(@Query('session_id') sessionId: string) {
    await this.paymentsService.handleSuccessfulPayment(sessionId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Payment processed successfully',
    };
  }
}