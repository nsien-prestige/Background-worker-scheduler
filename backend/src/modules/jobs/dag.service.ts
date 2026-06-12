import { Injectable, BadRequestException } from '@nestjs/common';
import { DagJobAction } from './actions/dag-job.action';

@Injectable()
export class DagService {
  constructor(private readonly dagJobAction: DagJobAction) {}

  async addDependency(jobId: string, dependsOnId: string): Promise<void> {
    if (jobId === dependsOnId) {
      throw new BadRequestException('A job cannot depend on itself');
    }

    const wouldCycle = await this.wouldCreateCycle(jobId, dependsOnId);
    if (wouldCycle) {
      throw new BadRequestException(
        'Adding this dependency would create a cycle',
      );
    }

    await this.dagJobAction.saveDependency(jobId, dependsOnId);
  }

  async areDependenciesMet(jobId: string): Promise<boolean> {
    const deps = await this.dagJobAction.getDependencies(jobId);
    if (deps.length === 0) return true;

    for (const dep of deps) {
      const completed = await this.dagJobAction.isJobCompleted(dep.depends_on_id);
      if (!completed) return false;
    }

    return true;
  }

  private async wouldCreateCycle(
    jobId: string,
    dependsOnId: string,
  ): Promise<boolean> {
    return this.canReach(dependsOnId, jobId, new Set());
  }

  private async canReach(
    from: string,
    target: string,
    visited: Set<string>,
  ): Promise<boolean> {
    if (from === target) return true;
    if (visited.has(from)) return false;

    visited.add(from);

    const deps = await this.dagJobAction.getDependenciesForJob(from);
    for (const dep of deps) {
      if (await this.canReach(dep.depends_on_id, target, visited)) {
        return true;
      }
    }

    return false;
  }

  async getDependents(jobId: string): Promise<string[]> {
    return this.dagJobAction.getDependents(jobId);
  }
}