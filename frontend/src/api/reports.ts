import { CreateReportDto, UpdateReportDto } from '../types';
import { reportsService, ReportQueryParams } from '../services/reports.service';

export const reportsApi = {
  list: (params?: ReportQueryParams) => reportsService.list(params).then((data) => ({ data })),
  get: (id: string) => reportsService.getById(id).then((data) => ({ data })),
  create: (dto: CreateReportDto) => reportsService.create(dto).then((data) => ({ data })),
  update: (id: string, dto: UpdateReportDto) => reportsService.update(id, dto).then((data) => ({ data })),
  delete: (id: string) => reportsService.remove(id).then(() => ({ data: {} })),
  toggleStatus: (id: string) => reportsService.toggleStatus(id).then((data) => ({ data })),
};

