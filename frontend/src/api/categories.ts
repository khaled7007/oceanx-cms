import { Category } from '../types';
import { categoriesService, CategoryQueryParams } from '../services/categories.service';

export const categoriesApi = {
  list: (params?: CategoryQueryParams) => categoriesService.list(params).then((data) => ({ data })),
  listAll: () => categoriesService.listAll().then((data) => ({ data })),
  get: (id: string) => categoriesService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<Category>) => categoriesService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<Category>) => categoriesService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => categoriesService.remove(id).then(() => ({ data: {} })),
};
