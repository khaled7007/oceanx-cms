import { NewsItem } from '../types';
import { newsService, NewsQueryParams } from '../services/news.service';

export const newsApi = {
  list: (params?: NewsQueryParams) => newsService.list(params).then((data) => ({ data })),
  get: (id: string) => newsService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<NewsItem>) => newsService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<NewsItem>) => newsService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => newsService.remove(id).then(() => ({ data: {} })),
  toggleStatus: (id: string) => newsService.toggleStatus(id).then((data) => ({ data })),
};

