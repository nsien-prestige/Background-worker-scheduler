import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';

export abstract class AbstractModelAction<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findPaginated(
    page: number,
    limit: number,
    options?: FindManyOptions<T>,
  ): Promise<{ data: T[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
  const entity = await this.findById(id);
  if (!entity) {
    return null;
  }
  
  Object.assign(entity, data);
  return this.repository.save(entity);
}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}