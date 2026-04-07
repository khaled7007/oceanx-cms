import { DashboardStats } from '../types';

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

const DUMMY_STATS: DashboardStats = {
  counts: {
    reports: { total: '3', published: '2', draft: '1' },
    articles: { total: '3', published: '2', draft: '1', featured: '1' },
    pages: { total: '2', published: '1' },
    news: { total: '3', published: '2' },
    services: { total: '4', active: '3' },
    media: { total: '5', total_size: '12.4 MB' },
  },
  recent_activity: [
    { type: 'article', title: 'The Future of Marine Research', status: 'published', created_at: new Date(Date.now() - 3600000).toISOString() },
    { type: 'report', title: 'Annual Ocean Health Report 2024', status: 'published', created_at: new Date(Date.now() - 7200000).toISOString() },
    { type: 'news', title: 'OceanX Launches New Research Initiative', status: 'published', created_at: new Date(Date.now() - 86400000).toISOString() },
    { type: 'page', title: 'About', status: 'published', created_at: new Date(Date.now() - 172800000).toISOString() },
    { type: 'service', title: 'Marine Research Consulting', status: 'active', created_at: new Date(Date.now() - 259200000).toISOString() },
  ],
};

export const dashboardApi = {
  getStats: () => r(DUMMY_STATS),
};

