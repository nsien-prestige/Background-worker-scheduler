import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../../config/env.config';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  sendDLQAlert(dlqCount: number, threshold: number): void {
    // In production this would use Nodemailer/Resend/SendGrid
    // For this simulation we log it as a critical structured alert
    this.logger.error(
      JSON.stringify({
        event: 'dlq.threshold.exceeded',
        alert: 'DLQ_THRESHOLD_EXCEEDED',
        to: env.ALERT_EMAIL,
        subject: `[ALERT] DLQ has ${dlqCount} failed jobs`,
        body: `The dead letter queue has exceeded the threshold of ${threshold} jobs. Current count: ${dlqCount}. Please investigate immediately.`,
        dlq_count: dlqCount,
        threshold,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}