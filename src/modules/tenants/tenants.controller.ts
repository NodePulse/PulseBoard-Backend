import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { API_ROUTES } from '../../core/constants/routes';
import { SessionGuard } from 'src/core/guards/session.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SessionPayload } from '../auth/auth.controller';

@Controller(API_ROUTES.TENANTS.ROOT)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post(API_ROUTES.TENANTS.CREATE_ORGANIZATION)
  @ResponseMessage(RESPONSE_MESSAGES.TENANT_CREATED)
  @UseGuards(SessionGuard)
  public async create(
    @CurrentUser() user: SessionPayload,
    @Body()
    dto: CreateTenantDTO,
  ) {
    if (!user?.sub) {
      throw new BadRequestException(RESPONSE_MESSAGES.HEADER_REQUIRED);
    }
    return this.tenantsService.createTenant(user?.sub, dto);
  }

  @Get(API_ROUTES.TENANTS.GET_ORGANIZATION)
  @UseGuards(SessionGuard)
  public async getOrganization(@CurrentUser() user: SessionPayload) {
    return this.tenantsService.getTenant(user?.sub);
  }
}
