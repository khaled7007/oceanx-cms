import { Partner } from '../types';
import { partnersService, PartnerQueryParams } from '../services/partners.service';

export const partnersApi = {
  list: (params?: PartnerQueryParams) => partnersService.list(params).then((data) => ({ data })),
  get: (id: string) => partnersService.getById(id).then((data) => ({ data })),
  create: (dto: { name: Partner['name']; img: string }) => partnersService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: { name?: Partner['name']; img?: string }) => partnersService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => partnersService.remove(id).then(() => ({ data: {} })),
};
