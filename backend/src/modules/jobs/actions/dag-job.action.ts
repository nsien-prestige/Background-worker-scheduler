import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JobDependency } from '../entities/job-dependency.entity';
import { Job } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';
import { AbstractModelAction } from '../../../database/abstract.action';

@Injectable()
export class DagJobAction extends AbstractModelAction<JobDependency> {
  constructor(
    @InjectRepository(JobDependency)
    repository: Repository<JobDependency>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {
    super(repository);
  }

  async saveDependency(jobId: string, dependsOnId: string): Promise<void> {
    await this.repository.save(
      this.repository.create({ job_id: jobId, depends_on_id: dependsOnId }),
    );
  }

  async getDependencies(jobId: string): Promise<JobDependency[]> {
    return this.repository.find({ where: { job_id: jobId } });
  }

  async getDependents(jobId: string): Promise<string[]> {
    const deps = await this.repository.find({
      where: { depends_on_id: jobId },
    });
    return deps.map(d => d.job_id);
  }

  async findJob(id: string): Promise<Job | null> {
    return this.jobRepository.findOne({ where: { id } });
  }

  /** Single query to check if all dependency jobs are completed */
  async areAllJobsCompleted(jobIds: string[]): Promise<boolean> {
    if (jobIds.length === 0) return true;

    const count = await this.jobRepository.count({
      where: {
        id: In(jobIds),
        status: JobStatus.COMPLETED,
      },
    });

    return count === jobIds.length;
  }
}