import { DashboardStats } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

async function countWhere(col: string, field?: string, value?: unknown): Promise<number> {
  const ref = collection(db, col);
  const q = field !== undefined && value !== undefined ? query(ref, where(field, '==', value)) : ref;
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export const dashboardApi = {
  getStats: async (): Promise<{ data: DashboardStats }> => {
    const [reportsTotal, reportsPublished, reportsDraft] = await Promise.all([
      countWhere('reports'),
      countWhere('reports', 'status', 'published'),
      countWhere('reports', 'status', 'draft'),
    ]);
    const [articlesTotal, articlesPublished, articlesDraft, articlesFeatured] = await Promise.all([
      countWhere('articles'),
      countWhere('articles', 'status', 'published'),
      countWhere('articles', 'status', 'draft'),
      countWhere('articles', 'featured', true),
    ]);
    const [pagesTotal, pagesPublished] = await Promise.all([
      countWhere('pages'),
      countWhere('pages', 'status', 'published'),
    ]);
    const [newsTotal, newsPublished] = await Promise.all([
      countWhere('news'),
      countWhere('news', 'status', 'published'),
    ]);
    const [servicesTotal, servicesActive] = await Promise.all([
      countWhere('services'),
      countWhere('services', 'active', true),
    ]);
    const mediaTotal = await countWhere('media');

    // Recent activity: latest 5 docs across all collections
    const recentCollections = ['articles', 'reports', 'news', 'pages', 'services'] as const;
    const recentDocs = await Promise.all(
      recentCollections.map(async (col) => {
        const q = query(collection(db, col), orderBy('created_at', 'desc'), limit(2));
        const snap = await getDocs(q);
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            type: col === 'articles' ? 'article' : col === 'reports' ? 'report' : col === 'news' ? 'news' : col === 'pages' ? 'page' : 'service',
            title: data.title_en || data.headline_en || data.title || '',
            status: data.status || (data.active ? 'active' : 'inactive'),
            created_at: data.created_at,
          };
        });
      }),
    );
    const recent_activity = recentDocs
      .flat()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5);

    return {
      data: {
        counts: {
          reports: { total: String(reportsTotal), published: String(reportsPublished), draft: String(reportsDraft) },
          articles: { total: String(articlesTotal), published: String(articlesPublished), draft: String(articlesDraft), featured: String(articlesFeatured) },
          pages: { total: String(pagesTotal), published: String(pagesPublished) },
          news: { total: String(newsTotal), published: String(newsPublished) },
          services: { total: String(servicesTotal), active: String(servicesActive) },
          media: { total: String(mediaTotal), total_size: '' },
        },
        recent_activity,
      },
    };
  },
};

