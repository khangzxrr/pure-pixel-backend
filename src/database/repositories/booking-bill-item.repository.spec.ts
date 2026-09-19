import { PrismaService } from 'src/prisma.service';
import { BookingBillItemRepository } from './booking-bill-item.repository';

describe('BookingBillItemRepository', () => {
  const bookingBillItem = {
    count: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  };
  const extended = { bookingBillItem };
  const prisma = {
    extendedClient: jest.fn(() => extended),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: BookingBillItemRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(bookingBillItem).forEach((fn) => fn.mockReturnValue(result));
    repository = new BookingBillItemRepository(prisma);
  });

  it('count should count with where', async () => {
    expect(await repository.count({ bookingId: 'b' })).toBe(result);
    expect(bookingBillItem.count).toHaveBeenCalledWith({
      where: { bookingId: 'b' },
    });
  });

  it('deleteById should delete by booking and id', async () => {
    expect(await repository.deleteById('booking', 'item')).toBe(result);
    expect(bookingBillItem.delete).toHaveBeenCalledWith({
      where: { id: 'item', bookingId: 'booking' },
    });
  });

  it('updateById should update by id', async () => {
    const data = { title: 'x' };

    expect(await repository.updateById('item', data)).toBe(result);
    expect(bookingBillItem.update).toHaveBeenCalledWith({
      where: { id: 'item' },
      data,
    });
  });

  it('create should create with data', async () => {
    const data = {
      title: 'x',
      price: 10,
      type: 'INCREASE' as const,
      booking: { connect: { id: 'b' } },
    };

    expect(await repository.create(data)).toBe(result);
    expect(bookingBillItem.create).toHaveBeenCalledWith({ data });
  });

  it('aggregate should forward args', async () => {
    const args = { _sum: { price: true as const } };

    expect(await repository.aggregate(args)).toBe(result);
    expect(bookingBillItem.aggregate).toHaveBeenCalledWith(args);
  });

  it('findMany should page with where', async () => {
    expect(await repository.findMany(1, 2, { bookingId: 'b' })).toBe(result);
    expect(bookingBillItem.findMany).toHaveBeenCalledWith({
      skip: 1,
      take: 2,
      where: { bookingId: 'b' },
    });
  });
});
