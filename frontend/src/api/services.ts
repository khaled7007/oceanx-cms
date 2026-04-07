import { Service, PaginatedResponse } from '../types';

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

function paginate<T extends Record<string, unknown>>(
  items: T[],
  params?: Record<string, string | number>,
): PaginatedResponse<T> {
  const page = Number(params?.page || 1);
  const limit = Number(params?.limit || 10);
  const search = ((params?.search as string) || '').toLowerCase();
  let filtered = items;
  if (search) filtered = filtered.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(search)));
  const total = filtered.length;
  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

let services: Service[] = [
  {
    id: '1',
    title_en: 'Marine Research Consulting',
    title_ar: 'استشارة البحوث البحرية',
    description_en: 'Expert consulting services for marine research projects and initiatives.',
    description_ar: 'خدمات استشارية متخصصة لمشاريع ومبادرات البحوث البحرية.',
    icon_url: '',
    image_url: '',
    order_index: 1,
    active: true,
    created_at: '2024-07-01T08:00:00Z',
    updated_at: '2024-07-01T08:00:00Z',
  },
  {
    id: '2',
    title_en: 'Oceanographic Data Analysis',
    title_ar: 'تحليل البيانات الأوقيانوغرافية',
    description_en: 'Advanced analysis of oceanographic datasets using modern computational methods.',
    description_ar: 'تحليل متقدم لمجموعات البيانات الأوقيانوغرافية باستخدام أساليب حسابية حديثة.',
    icon_url: '',
    image_url: '',
    order_index: 2,
    active: true,
    created_at: '2024-07-05T08:00:00Z',
    updated_at: '2024-07-05T08:00:00Z',
  },
  {
    id: '3',
    title_en: 'Environmental Impact Assessment',
    title_ar: 'تقييم الأثر البيئي',
    description_en: 'Comprehensive environmental impact assessments for coastal and offshore projects.',
    description_ar: 'تقييمات شاملة للأثر البيئي للمشاريع الساحلية والبحرية.',
    icon_url: '',
    image_url: '',
    order_index: 3,
    active: true,
    created_at: '2024-07-10T08:00:00Z',
    updated_at: '2024-07-10T08:00:00Z',
  },
  {
    id: '4',
    title_en: 'Underwater Survey Services',
    title_ar: 'خدمات المسح تحت المائي',
    description_en: 'Professional underwater survey and mapping services using ROV technology.',
    description_ar: 'خدمات احترافية للمسح ورسم الخرائط تحت الماء باستخدام تقنية ROV.',
    icon_url: '',
    image_url: '',
    order_index: 4,
    active: false,
    created_at: '2024-07-15T08:00:00Z',
    updated_at: '2024-07-15T08:00:00Z',
  },
];

export const servicesApi = {
  list: (params?: Record<string, string | number>) =>
    r(paginate(services as unknown as Record<string, unknown>[], params) as PaginatedResponse<Service>),
  get: (id: string) => r(services.find((x) => x.id === id) as Service),
  create: (data: Partial<Service>) => {
    const item: Service = {
      id: Date.now().toString(),
      title_en: data.title_en || '',
      title_ar: data.title_ar,
      description_en: data.description_en,
      description_ar: data.description_ar,
      icon_url: data.icon_url,
      image_url: data.image_url,
      order_index: data.order_index ?? services.length + 1,
      active: data.active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    services = [item, ...services];
    return r(item);
  },
  update: (id: string, data: Partial<Service>) => {
    services = services.map((x) => (x.id === id ? { ...x, ...data, updated_at: new Date().toISOString() } : x));
    return r(services.find((x) => x.id === id) as Service);
  },
  delete: (id: string) => { services = services.filter((x) => x.id !== id); return r({}); },
  toggleActive: (id: string) => {
    services = services.map((x) =>
      x.id === id ? { ...x, active: !x.active, updated_at: new Date().toISOString() } : x,
    );
    const u = services.find((x) => x.id === id)!;
    return r({ id: u.id, active: u.active });
  },
};

