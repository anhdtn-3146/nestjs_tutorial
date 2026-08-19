import typeormConfig from 'src/configs/typeorm.config';
import { CategoryEntity } from '../entities/category.entity';

export const CATEGORY_NAMES = [
  'Beach',
  'Adventure',
  'Cultural',
  'Food Tour',
  'Trekking',
  'City Tour',
  'Nature',
] as const;

export async function seedCategories(): Promise<void> {
  await typeormConfig.initialize();

  try {
    await typeormConfig
      .getRepository(CategoryEntity)
      .createQueryBuilder()
      .insert()
      .values(CATEGORY_NAMES.map((name) => ({ name })))
      .orIgnore()
      .execute();
  } finally {
    await typeormConfig.destroy();
  }
}

if (require.main === module) {
  void seedCategories().catch((error: unknown) => {
    console.error('Failed to seed categories', error);
    process.exitCode = 1;
  });
}
