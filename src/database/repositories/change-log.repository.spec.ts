import { PrismaService } from 'src/prisma.service';
import { ChangeLogRepository } from './change-log.repository';

describe('ChangeLogRepository', () => {
  const changeLog = {
    count: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = { changeLog } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: ChangeLogRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(changeLog).forEach((fn) => fn.mockReturnValue(result));
    repository = new ChangeLogRepository(prisma);
  });

  it('count should count with where', async () => {
    expect(await repository.count({ title: 't' })).toBe(result);
    expect(changeLog.count).toHaveBeenCalledWith({ where: { title: 't' } });
  });

  it('findByIdOrThrow should find by id', async () => {
    expect(await repository.findByIdOrThrow('c')).toBe(result);
    expect(changeLog.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'c' },
    });
  });

  it('findFirst should forward args', async () => {
    const args = { where: { title: 't' } };

    expect(await repository.findFirst(args)).toBe(result);
    expect(changeLog.findFirst).toHaveBeenCalledWith(args);
  });

  it('findAll should forward args', async () => {
    const args = { take: 1 };

    expect(await repository.findAll(args)).toBe(result);
    expect(changeLog.findMany).toHaveBeenCalledWith(args);
  });

  it('create should create with data', async () => {
    const data = { title: 't', content: 'c', version: '1.0.0', authorId: 'a' };

    expect(await repository.create(data)).toBe(result);
    expect(changeLog.create).toHaveBeenCalledWith({ data });
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('c', { title: 'n' })).toBe(result);
    expect(changeLog.update).toHaveBeenCalledWith({
      where: { id: 'c' },
      data: { title: 'n' },
    });
  });

  it('deleteById should delete by id', async () => {
    expect(await repository.deleteById('c')).toBe(result);
    expect(changeLog.delete).toHaveBeenCalledWith({ where: { id: 'c' } });
  });
});
