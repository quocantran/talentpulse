import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from './mail.service';
import { ApplicationStatus } from 'src/applications/entities/application.entity';

export interface ApplicationStatusEmailJobData {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  note?: string;
}

// Bull Queue Worker: processes email delivery asynchronously in background
@Processor('mail-queue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send-application-status-email')
  async handleSendApplicationStatusEmail(
    job: Job<ApplicationStatusEmailJobData>,
  ) {
    this.logger.log(
      `Processing email job for candidate: ${job.data.candidateEmail}, status: ${job.data.status}`,
    );

    try {
      await this.mailService.sendApplicationStatusEmail(job.data);
      this.logger.log(
        `Successfully sent application status email to ${job.data.candidateEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send application status email to ${job.data.candidateEmail}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
