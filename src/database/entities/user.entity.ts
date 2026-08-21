import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import { AuthSessionEntity } from './auth-session.entity';
import { BookingEntity } from './booking.entity';
import { ReviewEntity } from './review.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
@Check('CHK_users_role', `"role" IN ('user', 'admin')`)
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  authSessions: AuthSessionEntity[];

  @OneToMany(() => BookingEntity, (booking) => booking.user)
  bookings: BookingEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.user)
  reviews: ReviewEntity[];

  // Backward-compatible view fields for modules that still read legacy user shape.
  get username(): string {
    return this.fullName;
  }

  get bio(): string | null {
    return null;
  }

  get image(): string | null {
    return null;
  }

  get following(): boolean {
    return false;
  }
}
