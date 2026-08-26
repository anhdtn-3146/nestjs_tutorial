import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { CLOSE_STARTED_TOUR_TIMES_JOB, TOUR_JOBS_QUEUE } from './constants';
import { ToursService } from '../tours.service';

@Processor(TOUR_JOBS_QUEUE)
export class CloseStartedTourTimesProcessor {
  private readonly logger = new Logger(CloseStartedTourTimesProcessor.name);

  constructor(private readonly toursService: ToursService) {}

  @Process(CLOSE_STARTED_TOUR_TIMES_JOB)
  async closeStartedTourTimes(): Promise<void> {
    await this.toursService.closeStartedTourTimes();
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Close started tour times job ${job.id} failed`,
      error.stack,
    );
  }
}
