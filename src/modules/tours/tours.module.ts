import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { TourEntity } from 'src/database/entities/tour.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

@Module({
  imports: [TypeOrmModule.forFeature([TourEntity, CategoryEntity])],
  controllers: [ToursController],
  providers: [ToursService, RolesGuard],
})
export class ToursModule {}
