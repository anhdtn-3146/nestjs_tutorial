import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ArticleEntity } from './article.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: false })
  following: boolean;

  // Articles written
  @OneToMany(() => ArticleEntity, (article) => article.author)
  articles: ArticleEntity[];

  // Favorites article
  @ManyToMany(() => ArticleEntity, (article) => article.favoritedBy)
  favorites: ArticleEntity[];
}
