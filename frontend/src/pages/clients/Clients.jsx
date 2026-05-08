import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientApi } from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import FilterBar, { SelectFilter } from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { BuildingOfficeIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CLIENT_TYPES } from '../../constants';
import { downloadBlob } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CLIENT_TYPE_COLOR = { existing_client: 'green', new_prospect: 'blue', retailer: 'orange', corporate: 'purple', distributor: 'indigo', government: 'yellow', other: 'gray' };

export default function Clients() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [clientType, setClientType] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, clientType, status],
    queryFn: () => clientApi.list({ page, limit: 20, search, client_type: clientType, status }).then(r => r.data),
  });

  const handleExport = async () => {
    try {
      const res = await clientApi.export({ search, client_type: clientType, status });
      downloadBlob(res.data, 'clients.xlsx');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-gray-500">{data?.pagination?.total || 0} total clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary btn-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> Export
          </button>
          <Link to="/clients/new" className="btn-primary btn-sm">
            <PlusIcon className="w-4 h-4" /> Add Client
          </Link>
        </div>
      </div>

      <FilterBar onSearch={setSearch} searchValue={search} onReset={() => { setSearch(''); setClientType(''); setStatus(''); }}>
        <SelectFilter label="All Types" value={clientType} onChange={setClientType} options={CLIENT_TYPES} />
        <SelectFilter label="All Status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
      </FilterBar>

      {isLoading ? <PageSpinner /> : (
        <div className="card">
          {data?.data?.length === 0 ? (
            <EmptyState title="No clients found" description="Add your first client to get started" icon={BuildingOfficeIcon}
              action={<Link to="/clients/new" className="btn-primary btn-sm">Add Client</Link>} />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact</th>
                      <th>Mobile</th>
                      <th>City</th>
                      <th>Type</th>
                      <th>Salesperson</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(c => (
                      <tr key={c.id}>
                        <td className="font-medium text-gray-900">{c.company_name}</td>
                        <td className="text-gray-600">{c.contact_person || '—'}</td>
                        <td className="text-gray-600">{c.mobile || '—'}</td>
                        <td className="text-gray-600">{c.city || '—'}</td>
                        <td>
                          <Badge color={CLIENT_TYPE_COLOR[c.client_type] || 'gray'}>
                            {CLIENT_TYPES.find(t => t.value === c.client_type)?.label || c.client_type}
                          </Badge>
                        </td>
                        <td className="text-gray-600">{c.salesperson_name || '—'}</td>
                        <td>
                          <Badge color={c.status === 'active' ? 'green' : 'red'}>{c.status}</Badge>
                        </td>
                        <td>
                          <Link to={`/clients/${c.id}`} className="text-blue-600 text-sm hover:underline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={data.pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
