import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';

@Injectable()
export class EmailHandler {
  private readonly logger = new Logger(EmailHandler.name);

  async handle(job: Job): Promise<void> {
    const { to, subject } = job.payload as { to: string; subject: string };

    if (!to || !subject) {
      throw new Error('Invalid email payload — missing to or subject');
    }

    // Simulate random failure 20% of the time for retry testing
    if (Math.random() < 0.2) {
      throw new Error('Email service temporarily unavailable');
    }

    // Simulate processing time
    await this.sleep(500);

    this.logger.log(
      `Email sent — to=${to} subject="${subject}" jobId=${job.id}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}