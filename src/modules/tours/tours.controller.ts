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
import { Public } from 'src/modules/auth/public.decorator';
import { CreateTourDto } from './dto/create-tour.dto';
import { ListTourDto } from './dto/list-tour.dto';
import { SearchTourDto } from './dto/search-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';
import { TourImageUpload, tourImageUploadOptions } from './tour-upload.config';

@Controller()
@UseGuards(RolesGuard)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Public()
  @Get('tours')
  findPublic(@Query() query: SearchTourDto) {
    return this.toursService.findPublic(query);
  }

  @Public()
  @Get('tours/:id')
  findPublicOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findPublicOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/tours')
  findAll(@Query() query: ListTourDto) {
    return this.toursService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/tours/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/tours')
  @UseInterceptors(
    FilesInterceptor('images', MAX_TOUR_IMAGES, tourImageUploadOptions),
  )
  create(
    @Body() dto: CreateTourDto,
    @UploadedFiles() images: TourImageUpload[] = [],
  ) {
    return this.toursService.create(dto, images);
  }

  @Roles(UserRole.ADMIN)
  @Put('admin/tours/:id')
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

  @Roles(UserRole.ADMIN)
  @Delete('admin/tours/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.toursService.delete(id);
  }
}
