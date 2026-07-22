import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  public async findByEmailAndTenant(email: string, tenantId: string | null): Promise<User | null> {
    return this.findOne({
      where: {
        email,
        tenantId: tenantId === null ? IsNull() : tenantId,
      },
    });
  }

  public async findByEmailWithPassword(email: string, tenantId: string | null): Promise<User | null> {
    return this.findOne({
      where: {
        email,
        tenantId: tenantId === null ? IsNull() : tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        verificationToken: true,
        verificationOtp: true,
        verificationExpiresAt: true,
        workspaceRole: true,
        plan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }
}
