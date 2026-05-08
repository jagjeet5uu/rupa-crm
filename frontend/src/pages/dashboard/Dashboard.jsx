import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';
import {
  MapPinIcon, BellIcon, ChartBarIcon, CheckCircleIcon,
  ClockIcon, ExclamationTriangleIcon, CurrencyRupeeIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Badge from '../../components/common/Badge';
import { OPPORTUNITY_STAGES } from '../../constants';
import { Link } from 'react-router-dom';

const STAGE_COLORS = { identification: '#94a3b8', qualified: '#3b82f6', evaluation: '#8b5cf6', quotation_sent: '#f59e0b', negotiation: '#f97316', finalization: '#6366f1', won: '#22c55e', lost: '#ef4444' };

function SalesExecDashboard({ data }) {
  return (
    <div className="fade-in space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Follow-ups" value={data.today_followups} icon={BellIcon} color="blue" />
        <StatCard label="Overdue Follow-ups" value={data.overdue_followups} icon={ExclamationTriangleIcon} color="red" />
        <StatCard label="Visits This Month" value={data.month_visits} icon={MapPinIcon} color="green" />
        <StatCard label="Pending Approvals" value={data.pending_visits} icon={ClockIcon} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">My Pipeline</h3></div>
          <div className="p-4">
            {data.pipeline?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No active opportunities</p>
            ) : (
              <div className="space-y-3">
                {data.pipeline?.map(p => (
                  <div key={p.current_stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge color={OPPORTUNITY_STAGES.find(s => s.value === p.current_stage)?.color || 'gray'}>
                        {OPPORTUNITY_STAGES.find(s => s.value === p.current_stage)?.label || p.current_stage}
                      </Badge>
                      <span className="text-sm text-gray-600">{p.count} opp</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₹{Number(p.total_value).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">This Month Won / Lost</h3></div>
          <div className="p-4 flex items-center justify-center gap-8 py-8">
            {data.won_lost_this_month?.map(wl => (
              <div key={wl.current_stage} className="text-center">
                <div className={`text-3xl font-bold ${wl.current_stage === 'won' ? 'text-green-600' : 'text-red-500'}`}>{wl.count}</div>
                <div className="text-sm text-gray-500 capitalize mt-1">{wl.current_stage}</div>
              </div>
            ))}
            {data.won_lost_this_month?.length === 0 && <p className="text-sm text-gray-400">No data this month</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link to="/followups?status=pending" className="btn-primary btn-sm">View Today's Follow-ups</Link>
        <Link to="/visits/new" className="btn-secondary btn-sm">Add Visit</Link>
        <Link to="/opportunities/new" className="btn-secondary btn-sm">Add Opportunity</Link>
      </div>
    </div>
  );
}

function ManagerDashboard({ data }) {
  return (
    <div className="fade-in space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Approvals" value={data.pending_approvals} icon={ClockIcon} color="yellow" />
        <StatCard label="Overdue Follow-ups" value={data.overdue_followups} icon={ExclamationTriangleIcon} color="red" />
        <StatCard label="Pipeline Stages" value={data.pipeline?.length} icon={ChartBarIcon} color="blue" />
        <StatCard label="Team Members" value={data.team_visits?.length} icon={UsersIcon} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Team Visits This Month</h3></div>
          <div className="p-4">
            {data.team_visits?.map(t => (
              <div key={t.full_name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-700">{t.full_name}</span>
                <Badge color={t.visit_count > 10 ? 'green' : t.visit_count > 5 ? 'blue' : 'gray'}>{t.visit_count} visits</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Pipeline Value by Stage</h3></div>
          <div className="p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipeline}>
                <XAxis dataKey="current_stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {data.pipeline?.map(p => <Cell key={p.current_stage} fill={STAGE_COLORS[p.current_stage] || '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagementDashboard({ data }) {
  return (
    <div className="fade-in space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pipeline" value={`₹${Number(data.pipeline_total?.total_pipeline || 0).toLocaleString('en-IN')}`} icon={CurrencyRupeeIcon} color="blue" />
        <StatCard label="Active Opportunities" value={data.pipeline_total?.total_opportunities} icon={ChartBarIcon} color="purple" />
        <StatCard label="Month Billed" value={`₹${Number(data.month_billing?.total_billed || 0).toLocaleString('en-IN')}`} icon={CheckCircleIcon} color="green" />
        <StatCard label="Outstanding" value={`₹${Number(data.month_billing?.total_outstanding || 0).toLocaleString('en-IN')}`} icon={ExclamationTriangleIcon} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Brand-wise Pipeline</h3></div>
          <div className="p-4 space-y-3">
            {data.brand_pipeline?.slice(0, 8).map(b => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{b.name || 'Untagged'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{b.count} opps</span>
                  <span className="text-sm font-semibold text-gray-900">₹{Number(b.value).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Salesperson Performance</h3></div>
          <div className="p-4">
            {data.salesperson_performance?.slice(0, 8).map(sp => (
              <div key={sp.full_name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{sp.full_name}</p>
                  <p className="text-xs text-gray-400">{sp.visits} visits · {sp.won_opps} won</p>
                </div>
                <span className="text-sm font-bold text-green-600">₹{Number(sp.won_value).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => dashboardApi.get().then(r => r.data.data),
  });

  if (isLoading) return <PageSpinner />;

  const role = user?.role;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.full_name}</p>
        </div>
      </div>

      {(role === 'sales_executive') && data && <SalesExecDashboard data={data} />}
      {(role === 'sales_manager') && data && <ManagerDashboard data={data} />}
      {(['management', 'super_admin', 'admin'].includes(role)) && data && <ManagementDashboard data={data} />}
      {role === 'backend_ops' && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pending Quotations" value={data.pending_quotations} icon={ChartBarIcon} color="blue" />
          <StatCard label="Pending POs" value={data.pending_pos} icon={ClockIcon} color="yellow" />
          <StatCard label="Unmatched Billing" value={data.unmatched_billing} icon={ExclamationTriangleIcon} color="red" />
        </div>
      )}
    </div>
  );
}
