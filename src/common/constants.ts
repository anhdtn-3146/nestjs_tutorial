export const DEFAULT_OFFSET = 0;
export const DEFAULT_LIMIT = 20;

export const MAX_TOUR_IMAGES = 5;
export const MAX_TOUR_IMAGE_SIZE = 5 * 1024 * 1024;

export const TOUR_IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
