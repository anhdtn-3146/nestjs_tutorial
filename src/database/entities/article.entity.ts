import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { TagEntity } from './tag.entity';
import { UserEntity } from './user.entity';

@Entity('articles')
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column('text')
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Tags
  @ManyToMany(() => TagEntity, (tag) => tag.articles, {
    eager: true,
  })
  @JoinTable()
  tagList: TagEntity[];

  // Author
  @ManyToOne(() => UserEntity, (user) => user.articles, {
    eager: true,
    onDelete: 'CASCADE',
  })
  author: UserEntity;

  // Favorites
  @ManyToMany(() => UserEntity, (user) => user.favorites)
  @JoinTable()
  favoritedBy: UserEntity[];
}
