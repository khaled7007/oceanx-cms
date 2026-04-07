import { Article } from '../types';
import { articlesService, ArticleQueryParams } from '../services/articles.service';

export const articlesApi = {
  list: (params?: ArticleQueryParams) => articlesService.list(params).then((data) => ({ data })),
  get: (id: string) => articlesService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<Article>) => articlesService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<Article>) => articlesService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => articlesService.remove(id).then(() => ({ data: {} })),
  toggleStatus: (id: string) => articlesService.toggleStatus(id).then((data) => ({ data })),
};

