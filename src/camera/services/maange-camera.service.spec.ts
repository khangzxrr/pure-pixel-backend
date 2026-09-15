import { GraphSeperator } from '../enums/graph-seperator.enum';
import { ManageCameraService } from './maange-camera.service';

describe('ManageCameraService', () => {
  it('should be constructible', () => {
    expect(new ManageCameraService()).toBeInstanceOf(ManageCameraService);
  });
});

describe('GraphSeperator', () => {
  it('should expose postgres date_trunc units', () => {
    expect(GraphSeperator).toEqual({
      DAY: 'day',
      WEEK: 'week',
      MONTH: 'month',
      YEAR: 'year',
    });
  });
});
