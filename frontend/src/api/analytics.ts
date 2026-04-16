import { Analytics } from '../types';
import { analyticsService } from '../services/analytics.service';

export const analyticsApi = {
  get: () => analyticsService.get().then((data) => ({ data })),
  save: (dto: Analytics) => analyticsService.save(dto).then((data) => ({ data })),
};
