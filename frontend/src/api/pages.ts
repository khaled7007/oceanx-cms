import { Page } from '../types';
import { pagesService, PageQueryParams } from '../services/pages.service';

export const pagesApi = {
  list: (params?: PageQueryParams) => pagesService.list(params).then((data) => ({ data })),
  get: (id: string) => pagesService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<Page>) => pagesService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<Page>) => pagesService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => pagesService.remove(id).then(() => ({ data: {} })),
  toggleStatus: (id: string) => pagesService.toggleStatus(id).then((data) => ({ data })),
};

