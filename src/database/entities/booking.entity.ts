import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { TourTimeEntity } from './tour-time.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
@Index('IDX_bookings_user_id', ['userId'])
@Index('IDX_bookings_tour_time_id', ['tourTimeId'])
export class BookingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'tour_time_id' })
  tourTimeId: number;

  @ManyToOne(() => TourTimeEntity, (tourTime) => tourTime.bookings, {
    // Keep booking history safe; a booked departure must not be deleted.
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tour_time_id' })
  tourTime: TourTimeEntity;

  @Column({ name: 'number_of_slots', default: 1 })
  numberOfSlots: number;

  @Column({ type: 'varchar', length: 20, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
