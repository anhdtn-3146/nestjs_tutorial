import { TourEntity } from 'src/database/entities/tour.entity';

export type TourSerializerType = 'PUBLIC';

export class TourSerializer {
  constructor(
    private readonly tour: TourEntity,
    private readonly options: { type: TourSerializerType },
  ) {}

  serialize() {
    switch (this.options.type) {
      case 'PUBLIC':
        return this.serializePublic();
    }
  }

  private serializePublic() {
    return {
      id: this.tour.id,
      categoryId: this.tour.categoryId,
      category: this.tour.category?.name,
      title: this.tour.title,
      description: this.tour.description,
      images: this.tour.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        sortOrder: image.sortOrder,
      })),
      tourTimes: this.tour.tourTimes.map((tourTime) => ({
        id: tourTime.id,
        tourId: tourTime.tourId,
        startDate: tourTime.startDate,
        endDate: tourTime.endDate,
        price: tourTime.price,
        maxCapacity: tourTime.maxCapacity,
        status: tourTime.status,
      })),
    };
  }
}
