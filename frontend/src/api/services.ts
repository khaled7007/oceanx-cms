import { Service } from '../types';
import { servicesService, ServiceQueryParams } from '../services/services.service';

export const servicesApi = {
  list: (params?: ServiceQueryParams) => servicesService.list(params).then((data) => ({ data })),
  get: (id: string) => servicesService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<Service>) => servicesService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<Service>) => servicesService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => servicesService.remove(id).then(() => ({ data: {} })),
  toggleActive: (id: string) => servicesService.toggleActive(id).then((data) => ({ data })),
};

