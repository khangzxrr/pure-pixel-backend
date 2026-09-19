import { BullMqConfigService } from './bullmq-config.service';
import { BullMqQueueRegisterService } from './bullmq-queue-register.service';

describe('custom config services', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      REDIS_HOSTNAME: 'redis-host',
      REDIS_PORT: '6380',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('BullMqConfigService should build the shared connection', () => {
    expect(new BullMqConfigService().createSharedConfiguration()).toEqual({
      connection: { host: 'redis-host', port: 6380 },
    });
  });

  it('BullMqQueueRegisterService should build queue options', () => {
    expect(
      new BullMqQueueRegisterService().createRegisterQueueOptions(),
    ).toEqual({
      connection: { host: 'redis-host', port: 6380 },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
  });

});
