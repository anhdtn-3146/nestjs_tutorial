import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { TourImageEntity } from './tour-image.entity';
import { TourTimeEntity } from './tour-time.entity';

@Entity('tours')
@Index('IDX_tours_category_id', ['categoryId'])
export class TourEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => CategoryEntity, (category) => category.tours, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => TourImageEntity, (image) => image.tour)
  images: TourImageEntity[];

  @OneToMany(() => TourTimeEntity, (tourTime) => tourTime.tour)
  tourTimes: TourTimeEntity[];
}
