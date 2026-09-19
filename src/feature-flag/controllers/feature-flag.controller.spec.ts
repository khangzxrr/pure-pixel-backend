import { FeatureFlagController } from './feature-flag.controller';

describe('FeatureFlagController', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    [undefined, true],
    ['true', true],
    ['', true],
    ['false', false],
  ])('FEATURE_BOOKING=%p gives booking %p', (value, expected) => {
    process.env = { ...originalEnv };
    if (value === undefined) {
      delete process.env.FEATURE_BOOKING;
    } else {
      process.env.FEATURE_BOOKING = value;
    }

    expect(new FeatureFlagController().getFlags()).toEqual({
      booking: expected,
    });
  });
});
