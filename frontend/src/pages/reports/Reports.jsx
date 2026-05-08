import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi, userApi, masterApi } from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import { downloadBlob } from '../../hooks/useApi';
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const TABS = ['visits', 'opportunities', 'followups', 'billing'];

export default function Reports() {
  const [tab, setTab] = useState('visits');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [salespersonId, setSalespersonId] = useState('');

  const { data: salespeople } = useQuery({ queryKey: ['salespeople'], queryFn: () => userApi.list({ role: 'sales_executive' }).then(r => r.data.data) });

  const { data: visitReport, isLoading: visitLoading } = useQuery({
    queryKey: ['report-visits', fromDate, toDate, salespersonId],
    queryFn: () => reportApi.visits({ from_date: fromDate, to_date: toDate, salesperson_id: salespersonId }).then(r => r.data.data),
    enabled: tab === 'visits',
  });
  const { data: oppReport, isLoading: oppLoading } = useQuery({
    queryKey: ['report-opps', fromDate, toDate, salespersonId],
    queryFn: () => reportApi.opportunities({ from_date: fromDate, to_date: toDate, salesperson_id: salespersonId }).then(r => r.data.data),
    enabled: tab === 'opportunities',
  });
  const { data: followupReport, isLoading: fuLoading } = useQuery({
    queryKey: ['report-followups', fromDate, toDate, salespersonId],
    queryFn: () => reportApi.followups({ from_date: fromDate, to_date: toDate, salesperson_id: salespersonId }).then(r => r.data.data),
    enabled: tab === 'followups',
  });
  const { data: billingReport, isLoading: billLoading } = useQuery({
    queryKey: ['report-billing'],
    queryFn: () => reportApi.billing({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }).then(r => r.data.data),
    enabled: tab === 'billing',
  });

  const handleExport = async () => {
    try {
      const res = await reportApi.export({ type: tab, from_date: fromDate, to_date: toDate });
      downloadBlob(res.data, `${tab}-report.xlsx`);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <button onClick={handleExport} className="btn-secondary btn-sm">
          <ArrowDownTrayIcon className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input w-auto" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input w-auto" />
        <select value={salespersonId} onChange={e => setSalespersonId(e.target.value)} className="input w-auto">
          <option value="">All Salespeople</option>
          {salespeople?.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      {/* Visit Report */}
      {tab === 'visits' && (
        visitLoading ? <PageSpinner /> : (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Salesperson Visit Report</h3></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Salesperson</th><th>Total Visits</th><th>Approved</th><th>Pending</th></tr></thead>
                <tbody>
                  {visitReport?.map(r => (
                    <tr key={r.salesperson}>
                      <td className="font-medium">{r.salesperson}</td>
                      <td>{r.total_visits}</td>
                      <td><Badge color="green">{r.approved}</Badge></td>
                      <td><Badge color="yellow">{r.pending}</Badge></td>
                    </tr>
                  ))}
                  {!visitReport?.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Opportunity Report */}
      {tab === 'opportunities' && (
        oppLoading ? <PageSpinner /> : (
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Pipeline by Stage</h3></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Stage</th><th>Count</th><th>Total Value</th></tr></thead>
                  <tbody>
                    {oppReport?.summary?.map(r => (
                      <tr key={r.current_stage}>
                        <td><Badge color="blue">{r.current_stage}</Badge></td>
                        <td>{r.count}</td>
                        <td className="font-semibold">₹{Number(r.total_value).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Brand-wise Pipeline</h3></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Brand</th><th>Opps</th><th>Value</th><th>Won</th><th>Lost</th></tr></thead>
                  <tbody>
                    {oppReport?.brandwise?.map(r => (
                      <tr key={r.brand}>
                        <td className="font-medium">{r.brand || 'Untagged'}</td>
                        <td>{r.count}</td>
                        <td className="font-semibold">₹{Number(r.value).toLocaleString('en-IN')}</td>
                        <td><Badge color="green">{r.won}</Badge></td>
                        <td><Badge color="red">{r.lost}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* Follow-up Report */}
      {tab === 'followups' && (
        fuLoading ? <PageSpinner /> : (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Follow-up Report</h3></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Salesperson</th><th>Total</th><th>Completed</th><th>Overdue</th><th>Pending</th></tr></thead>
                <tbody>
                  {followupReport?.map(r => (
                    <tr key={r.salesperson}>
                      <td className="font-medium">{r.salesperson}</td>
                      <td>{r.total}</td>
                      <td><Badge color="green">{r.completed}</Badge></td>
                      <td><Badge color="red">{r.overdue}</Badge></td>
                      <td><Badge color="yellow">{r.pending}</Badge></td>
                    </tr>
                  ))}
                  {!followupReport?.length && <tr><td colSpan={5} className="text-center text-gray-400 py-8">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Billing Report */}
      {tab === 'billing' && (
        billLoading ? <PageSpinner /> : (
          <div className="space-y-4">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold">Client-wise Monthly Billing</h3></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Client</th><th>Current Month</th><th>Previous Month</th><th>Growth</th></tr></thead>
                  <tbody>
                    {billingReport?.clientBilling?.map(r => (
                      <tr key={r.company_name}>
                        <td className="font-medium">{r.company_name}</td>
                        <td>₹{Number(r.current_month).toLocaleString('en-IN')}</td>
                        <td>₹{Number(r.prev_month).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`text-sm font-medium ${r.growth_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {r.growth_pct != null ? `${r.growth_pct >= 0 ? '▲' : '▼'} ${Math.abs(r.growth_pct)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-red-600">Overdue Payments</h3></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Client</th><th>Invoice</th><th>Invoice Amt</th><th>Outstanding</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
                  <tbody>
                    {billingReport?.overduePayments?.map(r => (
                      <tr key={r.invoice_number}>
                        <td className="font-medium">{r.company_name}</td>
                        <td className="text-gray-600">{r.invoice_number}</td>
                        <td>₹{Number(r.invoice_amount).toLocaleString('en-IN')}</td>
                        <td className="text-red-600 font-semibold">₹{Number(r.outstanding_amount).toLocaleString('en-IN')}</td>
                        <td>{r.due_date}</td>
                        <td><Badge color="red">{r.days_overdue} days</Badge></td>
                      </tr>
                    ))}
                    {!billingReport?.overduePayments?.length && <tr><td colSpan={6} className="text-center text-gray-400 py-6">No overdue payments</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
