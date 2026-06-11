import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';

export abstract class AbstractModelAction<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
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