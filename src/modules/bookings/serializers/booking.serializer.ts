import { BookingEntity } from 'src/database/entities/booking.entity';

export type BookingSerializerType = 'USER' | 'ADMIN';

export class BookingSerializer {
  constructor(
    private readonly booking: BookingEntity,
    private readonly options: { type: BookingSerializerType },
  ) {}

  serialize() {
    switch (this.options.type) {
      case 'USER':
        return this.serializeForUser();
      case 'ADMIN':
        return this.serializeForAdmin();
    }
  }

  private serializeForUser() {
    const { tourTime } = this.booking;
    const { tour } = tourTime;

    return {
      id: this.booking.id,
      numberOfSlots: this.booking.numberOfSlots,
      status: this.booking.status,
      totalPrice: this.booking.totalPrice,
      tourTime: {
        id: tourTime.id,
        startDate: tourTime.startDate,
        endDate: tourTime.endDate,
      },
      tour: {
        id: tour.id,
        name: tour.title,
        category: tour.category?.name ?? null,
        images: tour.images.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
        })),
      },
    };
  }

  private serializeForAdmin() {
    return {
      ...this.serializeForUser(),
      user: {
        id: this.booking.user.id,
        name: this.booking.user.fullName,
        email: this.booking.user.email,
        phone: this.booking.user.phone,
      },
      createdAt: this.booking.createdAt,
    };
  }
}
