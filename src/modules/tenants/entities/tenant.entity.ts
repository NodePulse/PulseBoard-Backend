import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
export class Tenant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 255, nullable: false })
  name: string;

  @ApiProperty()
  @Column({ length: 100, unique: true })
  slug: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 9, unique: true })
  code: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @ApiProperty()
  @Column({ type: 'simple-json', nullable: true, default: '{}' })
  settings: Record<string, unknown>;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty()
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
