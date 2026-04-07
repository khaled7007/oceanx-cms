import { Article, PaginatedResponse } from '../types';

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

let articles: Article[] = [
  {
    id: '1',
    title_en: 'The Future of Marine Research',
    title_ar: 'مستقبل أبحاث البحار',
    body_en: '<p>Marine research is evolving rapidly with new technologies enabling deeper exploration.</p>',
    body_ar: '<p>تتطور أبحاث البحار بسرعة مع التقنيات الجديدة التي تتيح استكشافاً أعمق.</p>',
    author: 'Dr. Sarah Al-Rashid',
    category: 'Research',
    cover_image: '',
    status: 'published',
    featured: true,
    created_at: '2024-10-15T08:00:00Z',
    updated_at: '2024-10-15T08:00:00Z',
  },
  {
    id: '2',
    title_en: 'Deep Sea Exploration Techniques',
    title_ar: 'تقنيات استكشاف أعماق البحار',
    body_en: '<p>Advanced submersible technology is opening new frontiers in deep sea research.</p>',
    body_ar: '<p>تفتح تقنيات الغواصات المتقدمة آفاقاً جديدة في أبحاث أعماق البحار.</p>',
    author: 'Prof. Khalid Al-Ghamdi',
    category: 'Technology',
    cover_image: '',
    status: 'published',
    featured: false,
    created_at: '2024-11-20T10:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: '3',
    title_en: 'Oceanographic Survey Methods',
    title_ar: 'أساليب المسح الأوقيانوغرافي',
    body_en: '<p>Modern oceanographic surveys combine satellite data with in-situ measurements.</p>',
    body_ar: '<p>تجمع المسوحات الأوقيانوغرافية الحديثة بيانات الأقمار الاصطناعية مع القياسات الميدانية.</p>',
    author: 'Dr. Ahmed Al-Zahrani',
    category: 'Methods',
    cover_image: '',
    status: 'draft',
    featured: false,
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-01T09:00:00Z',
  },
];

export const articlesApi = {
  list: (params?: Record<string, string | number>) =>
    r(paginate(articles as unknown as Record<string, unknown>[], params) as PaginatedResponse<Article>),
  get: (id: string) => r(articles.find((a) => a.id === id) as Article),
  create: (data: Partial<Article>) => {
    const item: Article = {
      id: Date.now().toString(),
      title_en: data.title_en || '',
      title_ar: data.title_ar,
      body_en: data.body_en,
      body_ar: data.body_ar,
      author: data.author,
      category: data.category,
      cover_image: data.cover_image,
      status: data.status || 'draft',
      featured: data.featured || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    articles = [item, ...articles];
    return r(item);
  },
  update: (id: string, data: Partial<Article>) => {
    articles = articles.map((a) => (a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a));
    return r(articles.find((a) => a.id === id) as Article);
  },
  delete: (id: string) => { articles = articles.filter((a) => a.id !== id); return r({}); },
  toggleStatus: (id: string) => {
    articles = articles.map((a) =>
      a.id === id
        ? { ...a, status: a.status === 'published' ? 'draft' : 'published', updated_at: new Date().toISOString() }
        : a,
    );
    const u = articles.find((a) => a.id === id)!;
    return r({ id: u.id, status: u.status });
  },
};

