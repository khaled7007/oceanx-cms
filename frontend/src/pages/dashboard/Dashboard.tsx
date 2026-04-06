import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  to: string;
}

function StatCard({ label, value, sub, color, to }: StatCardProps) {
  return (
    <Link to={to} className={`block bg-white rounded-xl p-5 shadow-sm border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 h-28 animate-pulse border-l-4 border-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-500 text-sm">Failed to load dashboard statistics.</p>;
  }

  const { counts, recent_activity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Content Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Reports"
            value={counts.reports.total}
            sub={`${counts.reports.published} published · ${counts.reports.draft} drafts`}
            color="border-blue-500"
            to="/reports"
          />
          <StatCard
            label="Articles"
            value={counts.articles.total}
            sub={`${counts.articles.published} published · ${counts.articles.featured} featured`}
            color="border-purple-500"
            to="/articles"
          />
          <StatCard
            label="Pages"
            value={counts.pages.total}
            sub={`${counts.pages.published} published`}
            color="border-green-500"
            to="/pages"
          />
          <StatCard
            label="News"
            value={counts.news.total}
            sub={`${counts.news.published} published`}
            color="border-yellow-500"
            to="/news"
          />
          <StatCard
            label="Services"
            value={counts.services.total}
            sub={`${counts.services.active} active`}
            color="border-teal-500"
            to="/services"
          />
          <StatCard
            label="Media Files"
            value={counts.media.total}
            sub={counts.media.total_size ? `${counts.media.total_size} used` : undefined}
            color="border-orange-500"
            to="/media"
          />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {recent_activity.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">No activity yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_activity.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 capitalize">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{item.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
