import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { User, UserPlan, WorkspaceRole } from '../users/entities/user.entity';
import { CreateTenantDTO } from './dto/create-tenant.dto';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { UserRepository } from '../users/repositories/user.repository';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly userRepository: UserRepository,
  ) {}

  public async createTenant(userId: string, dto: CreateTenantDTO): Promise<Tenant> {
    const { name, slug } = dto;

    // 1. Find user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    // 2. Business rule check: "any user not able to make a tenant if that user have not any plan other than free"
    if (user.plan === UserPlan.FREE) {
      throw new ForbiddenException(RESPONSE_MESSAGES.FREE_PLAN_RESTRICTION);
    }

    // 3. Check if slug is already taken
    const existingTenant = await this.tenantRepository.findOne({ where: { slug } });
    if (existingTenant) {
      throw new ConflictException(RESPONSE_MESSAGES.TENANT_SLUG_CONFLICT);
    }

    // 4. Create and save the Tenant
    const tenant = this.tenantRepository.create({
      name,
      slug,
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    // 5. Update user to associate with the tenant and set workspace role to OWNER
    user.tenantId = savedTenant.id;
    user.workspaceRole = WorkspaceRole.OWNER;
    await this.userRepository.save(user);

    return savedTenant;
  }
}
