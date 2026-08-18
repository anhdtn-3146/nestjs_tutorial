import { BadRequestException } from '@nestjs/common';
import {
  MAX_TOUR_IMAGE_SIZE,
  TOUR_IMAGE_EXTENSIONS,
} from 'src/common/constants';

export interface TourImageUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export const tourImageUploadOptions = {
  limits: { fileSize: MAX_TOUR_IMAGE_SIZE },
  fileFilter: (
    _request: unknown,
    file: TourImageUpload,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!TOUR_IMAGE_EXTENSIONS[file.mimetype]) {
      callback(
        new BadRequestException('Only JPG, PNG and WEBP images are allowed'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
