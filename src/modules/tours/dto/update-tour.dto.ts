import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EditTourTimeDto } from './edit-tour-time.dto';
import {
  parseJsonArrayAs,
  parseJsonValue,
} from 'src/common/transforms/json.transform';

export class UpdateTourDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare category_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare title: string;

  @IsOptional()
  @IsString()
  declare description?: string | null;

  @Transform(parseJsonArrayAs(EditTourTimeDto))
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EditTourTimeDto)
  declare tour_times: EditTourTimeDto[];

  @IsOptional()
  @Transform(parseJsonValue)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  declare deleted_tour_time_ids?: number[];
}
