import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TourEntity } from './tour.entity';
import { UserEntity } from './user.entity';

@Entity('reviews')
@Index('IDX_reviews_user_id', ['userId'])
@Index('IDX_reviews_tour_id', ['tourId'])
@Check('CHK_reviews_rating', `"rating" BETWEEN 1 AND 5`)
export class ReviewEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'tour_id' })
  tourId: number;

  @ManyToOne(() => TourEntity, (tour) => tour.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tour_id' })
  tour: TourEntity;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
