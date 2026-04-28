import { applicationsService, ApplicationQueryParams } from '../services/applications.service';

export const applicationsApi = {
  list: (params?: ApplicationQueryParams) =>
    applicationsService.list(params).then((data) => ({ data })),
  delete: (id: string) =>
    applicationsService.remove(id).then(() => ({ data: {} })),
};
