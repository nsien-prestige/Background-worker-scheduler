import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  /** Saves a new dependency */
  async saveDependency(jobId: string, dependsOnId: string): Promise<void> {
    await this.repository.save(
      this.repository.create({ job_id: jobId, depends_on_id: dependsOnId }),
    );
  }

  /** Gets all dependencies for a job */
  async getDependencies(jobId: string): Promise<JobDependency[]> {
    return this.repository.find({ where: { job_id: jobId } });
  }

  /** Gets all jobs that depend on a given job */
  async getDependents(jobId: string): Promise<string[]> {
    const deps = await this.repository.find({
      where: { depends_on_id: jobId },
    });
    return deps.map(d => d.job_id);
  }

  /** Finds a job by id for dependency status check */
  async findJob(id: string): Promise<Job | null> {
    return this.jobRepository.findOne({ where: { id } });
  }

  /** Gets all dependencies for DFS traversal */
  async getDependenciesForJob(jobId: string): Promise<JobDependency[]> {
    return this.repository.find({ where: { job_id: jobId } });
  }

  /** Checks if a job is completed */
  async isJobCompleted(id: string): Promise<boolean> {
    const job = await this.jobRepository.findOne({ where: { id } });
    return job?.status === JobStatus.COMPLETED;
  }
}