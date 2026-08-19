import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TourTimeStatus } from 'src/database/entities/tour-time.entity';
import { CreateTourTimeDto } from './create-tour-time.dto';
import { CreateTourDto } from './create-tour.dto';
import { EditTourTimeDto } from './edit-tour-time.dto';
import { UpdateTourDto } from './update-tour.dto';

describe('Tour FormData DTOs', () => {
  it('parses and validates create tour_times from a JSON string', async () => {
    const dto = plainToInstance(CreateTourDto, {
      category_id: '1',
      title: 'Da Nang tour',
      tour_times: JSON.stringify([
        {
          start_date: '2030-01-01',
          end_date: '2030-01-03',
          price: 2500000,
          max_capacity: 20,
        },
      ]),
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.tour_times[0]).toBeInstanceOf(CreateTourTimeDto);
  });

  it('parses update arrays from JSON strings', async () => {
    const dto = plainToInstance(UpdateTourDto, {
      category_id: '1',
      title: 'Updated tour',
      tour_times: JSON.stringify([
        {
          id: 10,
          start_date: '2030-01-01',
          end_date: '2030-01-03',
          price: 2500000,
          max_capacity: 20,
          status: TourTimeStatus.OPEN,
        },
      ]),
      deleted_tour_time_ids: '[11,12]',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.tour_times[0]).toBeInstanceOf(EditTourTimeDto);
    expect(dto.deleted_tour_time_ids).toEqual([11, 12]);
  });
});
