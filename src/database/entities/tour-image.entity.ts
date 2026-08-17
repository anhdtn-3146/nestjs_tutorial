import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TourEntity } from './tour.entity';

@Entity('tour_images')
@Index('IDX_tour_images_tour_id', ['tourId'])
export class TourImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tour_id' })
  tourId: number;

  @ManyToOne(() => TourEntity, (tour) => tour.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: TourEntity;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
