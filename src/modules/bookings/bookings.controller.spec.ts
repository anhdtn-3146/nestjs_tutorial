import { IS_PUBLIC_KEY } from 'src/modules/auth/public.decorator';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { BookingStatus } from 'src/database/entities/booking.entity';
import { UserRole } from 'src/database/entities/user.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  const bookingsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findAllForAdmin: jest.fn(),
    updateStatus: jest.fn(),
  };
  const controller = new BookingsController(
    bookingsService as unknown as BookingsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists bookings for the authenticated user', async () => {
    const request = { user: { sub: 7 } };
    const query = { limit: 10, offset: 0 };
    bookingsService.findAll.mockResolvedValue({
      bookings: [],
      page: { total: 0, ...query },
    });

    await expect(controller.findAll(request as never, query)).resolves.toEqual({
      bookings: [],
      page: { total: 0, ...query },
    });
    expect(bookingsService.findAll).toHaveBeenCalledWith(7, query);
  });

  it('creates a booking for the authenticated user', async () => {
    const request = { user: { sub: 7 } };
    const dto = { tour_time_id: 5, number_of_slots: 2 };
    bookingsService.create.mockResolvedValue({ success: true });

    await expect(controller.create(request as never, dto)).resolves.toEqual({
      success: true,
    });
    expect(bookingsService.create).toHaveBeenCalledWith(7, dto);
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, BookingsController),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, controller.create),
    ).toBeUndefined();
  });

  it('delegates admin list and status update with admin role metadata', async () => {
    const query = { limit: 10, offset: 0, status: BookingStatus.PENDING };
    const dto = { status: BookingStatus.APPROVED } as const;
    bookingsService.findAllForAdmin.mockResolvedValue({ bookings: [] });
    bookingsService.updateStatus.mockResolvedValue({ success: true });

    await controller.findAllForAdmin(query);
    await expect(controller.updateStatus(10, dto)).resolves.toEqual({
      success: true,
    });
    expect(bookingsService.findAllForAdmin).toHaveBeenCalledWith(query);
    expect(bookingsService.updateStatus).toHaveBeenCalledWith(10, dto);
    expect(Reflect.getMetadata(ROLES_KEY, controller.findAllForAdmin)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.updateStatus)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});
