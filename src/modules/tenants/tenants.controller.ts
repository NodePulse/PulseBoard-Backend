import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { API_PATHS } from '../../core/constants/paths';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';

@Controller(API_PATHS.TENANTS.ROOT)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ResponseMessage(RESPONSE_MESSAGES.TENANT_CREATED)
  public async create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateTenantDTO,
  ) {
    if (!userId) {
      throw new BadRequestException(RESPONSE_MESSAGES.HEADER_REQUIRED);
    }
    return this.tenantsService.createTenant(userId, dto);
  }
}
