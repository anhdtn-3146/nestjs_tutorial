import { TIME_ZONE } from 'src/common/constants';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export function today(now = new Date()): string {
  return dayjs(now).tz(TIME_ZONE).format('YYYY-MM-DD');
}
