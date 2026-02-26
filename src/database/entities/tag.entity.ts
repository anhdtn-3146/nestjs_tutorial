import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { ArticleEntity } from './article.entity';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => ArticleEntity, (article) => article.tagList)
  articles: ArticleEntity[];
}
