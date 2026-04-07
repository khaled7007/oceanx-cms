import { Page, PaginatedResponse } from '../types';

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

let pages: Page[] = [
  {
    id: '1',
    slug: 'about',
    title_en: 'About OceanX',
    title_ar: 'عن أوشن إكس',
    sections: [
      { type: 'hero', title_en: 'About Us', title_ar: 'من نحن', body_en: '<p>OceanX is dedicated to ocean exploration and marine research.</p>', body_ar: '<p>تكرس أوشن إكس جهودها لاستكشاف المحيطات والبحث البحري.</p>' },
    ],
    meta_title: 'About OceanX | Ocean Exploration',
    meta_description: 'Learn about OceanX and our mission.',
    meta_keywords: 'OceanX, ocean, research',
    status: 'published',
    created_at: '2024-08-01T08:00:00Z',
    updated_at: '2024-08-01T08:00:00Z',
  },
  {
    id: '2',
    slug: 'contact',
    title_en: 'Contact Us',
    title_ar: 'اتصل بنا',
    sections: [
      { type: 'contact', title_en: 'Get in Touch', title_ar: 'تواصل معنا', body_en: '<p>Reach out to the OceanX team.</p>', body_ar: '<p>تواصل مع فريق أوشن إكس.</p>' },
    ],
    meta_title: 'Contact OceanX',
    meta_description: 'Contact the OceanX team.',
    meta_keywords: 'contact, OceanX',
    status: 'draft',
    created_at: '2024-09-01T09:00:00Z',
    updated_at: '2024-09-01T09:00:00Z',
  },
];

export const pagesApi = {
  list: (params?: Record<string, string | number>) =>
    r(paginate(pages as unknown as Record<string, unknown>[], params) as PaginatedResponse<Page>),
  get: (id: string) => r(pages.find((x) => x.id === id) as Page),
  create: (data: Partial<Page>) => {
    const item: Page = {
      id: Date.now().toString(),
      slug: data.slug || '',
      title_en: data.title_en || '',
      title_ar: data.title_ar,
      sections: data.sections,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
      status: data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    pages = [item, ...pages];
    return r(item);
  },
  update: (id: string, data: Partial<Page>) => {
    pages = pages.map((x) => (x.id === id ? { ...x, ...data, updated_at: new Date().toISOString() } : x));
    return r(pages.find((x) => x.id === id) as Page);
  },
  delete: (id: string) => { pages = pages.filter((x) => x.id !== id); return r({}); },
  toggleStatus: (id: string) => {
    pages = pages.map((x) =>
      x.id === id
        ? { ...x, status: x.status === 'published' ? 'draft' : 'published', updated_at: new Date().toISOString() }
        : x,
    );
    const u = pages.find((x) => x.id === id)!;
    return r({ id: u.id, status: u.status });
  },
};

