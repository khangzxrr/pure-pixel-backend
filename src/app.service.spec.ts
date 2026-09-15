import { AppService } from './app.service';

describe('AppService', () => {
  it('getHello should return the greeting', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });
});
