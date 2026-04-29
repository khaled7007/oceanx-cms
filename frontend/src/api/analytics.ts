import { Analytics, ContactInfo } from '../types';
import { analyticsService, contactInfoService } from '../services/analytics.service';

export const analyticsApi = {
  get: () => analyticsService.get().then((data) => ({ data })),
  save: (dto: Analytics) => analyticsService.save(dto).then((data) => ({ data })),
};

export const contactInfoApi = {
  get: () => contactInfoService.get().then((data) => ({ data })),
  save: (dto: ContactInfo) => contactInfoService.save(dto).then((data) => ({ data })),
};
