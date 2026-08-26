import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TIME_ZONE } from 'src/common/constants';
import { CloseStartedTourTimesScheduler } from './close-started-tour-times.scheduler';
import { CLOSE_STARTED_TOUR_TIMES_JOB, TOUR_JOBS_QUEUE } from './constants';

describe('CloseStartedTourTimesScheduler', () => {
  it('registers the repeatable job with the configured cron expression', async () => {
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const configService = {
      get: jest.fn().mockReturnValue('0 1 * * *'),
    };
    const module = await Test.createTestingModule({
      providers: [
        CloseStartedTourTimesScheduler,
        { provide: getQueueToken(TOUR_JOBS_QUEUE), useValue: queue },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    const scheduler = module.get(CloseStartedTourTimesScheduler);

    await scheduler.onModuleInit();

    expect(queue.add).toHaveBeenCalledWith(
      CLOSE_STARTED_TOUR_TIMES_JOB,
      {},
      {
        jobId: CLOSE_STARTED_TOUR_TIMES_JOB,
        repeat: { cron: '0 1 * * *', tz: TIME_ZONE },
      },
    );
  });
});
