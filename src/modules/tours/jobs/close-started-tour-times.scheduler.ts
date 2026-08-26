import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bull';
import { TIME_ZONE } from 'src/common/constants';
import {
  CLOSE_STARTED_TOUR_TIMES_JOB,
  DEFAULT_CLOSE_STARTED_TOUR_TIMES_CRON,
  TOUR_JOBS_QUEUE,
} from './constants';

@Injectable()
export class CloseStartedTourTimesScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(TOUR_JOBS_QUEUE)
    private readonly tourJobsQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const cron = this.configService.get<string>(
      'CLOSE_STARTED_TOUR_TIMES_CRON',
      DEFAULT_CLOSE_STARTED_TOUR_TIMES_CRON,
    );

    await this.tourJobsQueue.add(
      CLOSE_STARTED_TOUR_TIMES_JOB,
      {},
      {
        jobId: CLOSE_STARTED_TOUR_TIMES_JOB,
        repeat: { cron, tz: TIME_ZONE },
      },
    );
  }
}
