import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { MAX_TOUR_IMAGES } from 'src/common/constants';
import { UserRole } from 'src/database/entities/user.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { ListTourDto } from './dto/list-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';
import { TourImageUpload, tourImageUploadOptions } from './tour-upload.config';

@Controller('admin/tours')
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  findAll(@Query() query: ListTourDto) {
    return this.toursService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', MAX_TOUR_IMAGES, tourImageUploadOptions),
  )
  create(
    @Body() dto: CreateTourDto,
    @UploadedFiles() images: TourImageUpload[] = [],
  ) {
    return this.toursService.create(dto, images);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', MAX_TOUR_IMAGES, tourImageUploadOptions),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourDto,
    @UploadedFiles() images: TourImageUpload[] = [],
  ) {
    return this.toursService.update(id, dto, images);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.delete(id);
  }
}
