import { Competency } from '../types';
import { competenciesService, CompetencyQueryParams } from '../services/competencies.service';

export const competenciesApi = {
  list: (params?: CompetencyQueryParams) => competenciesService.list(params).then((data) => ({ data })),
  get: (id: string) => competenciesService.getById(id).then((data) => ({ data })),
  create: (dto: Partial<Competency>) => competenciesService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: Partial<Competency>) => competenciesService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => competenciesService.remove(id).then(() => ({ data: {} })),
};
