import { NewsItem, PaginatedResponse } from '../types';

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

function paginate<T extends Record<string, unknown>>(
  items: T[],
  params?: Record<string, string | number>,
): PaginatedResponse<T> {
  const page = Number(params?.page || 1);
  const limit = Number(params?.limit || 10);
  const search = ((params?.search as string) || '').toLowerCase();
  const status = params?.status as string | undefined;
  let filtered = items;
  if (search) filtered = filtered.filter((i) => Object.values(i).some((v) => String(v).toLowerCase().includes(search)));
  if (status) filtered = filtered.filter((i) => i.status === status);
  const total = filtered.length;
  const start = (page - 1) * limit;
  return { data: filtered.slice(start, start + limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

let newsItems: NewsItem[] = [
  {
    id: '1',
    headline_en: 'OceanX Launches New Research Initiative',
    headline_ar: 'أوشن إكس تطلق مبادرة بحثية جديدة',
    body_en: '<p>OceanX has announced a major new research initiative focused on deep sea ecosystems in the Red Sea.</p>',
    body_ar: '<p>أعلنت أوشن إكس عن مبادرة بحثية جديدة كبرى تركز على النظم البيئية لأعماق البحار في البحر الأحمر.</p>',
    source: 'OceanX Press',
    publish_date: '2025-01-15',
    cover_image: '',
    status: 'published',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-01-15T08:00:00Z',
  },
  {
    id: '2',
    headline_en: 'Partnership with Global Marine Institute',
    headline_ar: 'شراكة مع المعهد البحري العالمي',
    body_en: '<p>OceanX has signed a strategic partnership agreement with the Global Marine Institute to advance marine conservation efforts.</p>',
    body_ar: '<p>وقّعت أوشن إكس اتفاقية شراكة استراتيجية مع المعهد البحري العالمي لتعزيز جهود حماية البيئة البحرية.</p>',
    source: 'Marine News Network',
    publish_date: '2024-11-10',
    cover_image: '',
    status: 'published',
    created_at: '2024-11-10T09:00:00Z',
    updated_at: '2024-11-10T09:00:00Z',
  },
  {
    id: '3',
    headline_en: 'New Equipment Acquisition for Deep Sea Research',
    headline_ar: 'اقتناء معدات جديدة لأبحاث أعماق البحار',
    body_en: '<p>OceanX acquires state-of-the-art deep sea research equipment to enhance its exploration capabilities.</p>',
    body_ar: '<p>تقتني أوشن إكس أحدث معدات البحث في أعماق البحار لتعزيز قدراتها الاستكشافية.</p>',
    source: 'OceanX Press',
    publish_date: '',
    cover_image: '',
    status: 'draft',
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
];

export const newsApi = {
  list: (params?: Record<string, string | number>) =>
    r(paginate(newsItems as unknown as Record<string, unknown>[], params) as PaginatedResponse<NewsItem>),
  get: (id: string) => r(newsItems.find((x) => x.id === id) as NewsItem),
  create: (data: Partial<NewsItem>) => {
    const item: NewsItem = {
      id: Date.now().toString(),
      headline_en: data.headline_en || '',
      headline_ar: data.headline_ar,
      body_en: data.body_en,
      body_ar: data.body_ar,
      source: data.source,
      publish_date: data.publish_date,
      cover_image: data.cover_image,
      status: data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    newsItems = [item, ...newsItems];
    return r(item);
  },
  update: (id: string, data: Partial<NewsItem>) => {
    newsItems = newsItems.map((x) => (x.id === id ? { ...x, ...data, updated_at: new Date().toISOString() } : x));
    return r(newsItems.find((x) => x.id === id) as NewsItem);
  },
  delete: (id: string) => { newsItems = newsItems.filter((x) => x.id !== id); return r({}); },
  toggleStatus: (id: string) => {
    newsItems = newsItems.map((x) =>
      x.id === id
        ? { ...x, status: x.status === 'published' ? 'draft' : 'published', updated_at: new Date().toISOString() }
        : x,
    );
    const u = newsItems.find((x) => x.id === id)!;
    return r({ id: u.id, status: u.status });
  },
};

