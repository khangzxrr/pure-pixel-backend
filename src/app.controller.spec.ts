import { AppController } from './app.controller';

describe('AppController', () => {
  it('should be constructible', () => {
    expect(new AppController()).toBeInstanceOf(AppController);
  });
});
