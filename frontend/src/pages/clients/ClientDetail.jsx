import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientApi, visitApi, followupApi, opportunityApi } from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { CLIENT_TYPES, OPPORTUNITY_STAGES, VISIT_APPROVAL, FOLLOWUP_STATUS } from '../../constants';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, BuildingOfficeIcon, PencilIcon } from '@heroicons/react/24/outline';

const CLIENT_TYPE_COLOR = { existing_client: 'green', new_prospect: 'blue', retailer: 'orange', corporate: 'purple', distributor: 'indigo', government: 'yellow', other: 'gray' };

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['client-profile', id],
    queryFn: () => clientApi.profile(id).then(r => r.data.data),
  });
  const { data: visits } = useQuery({
    queryKey: ['client-visits', id],
    queryFn: () => visitApi.list({ client_id: id, limit: 5 }).then(r => r.data.data),
  });
  const { data: opportunities } = useQuery({
    queryKey: ['client-opps', id],
    queryFn: () => opportunityApi.list({ client_id: id, limit: 5 }).then(r => r.data.data),
  });

  if (isLoading) return <PageSpinner />;
  if (!profile) return <div className="text-center py-16 text-gray-500">Client not found</div>;

  const c = profile;

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="page-title">{c.company_name}</h1>
            <Badge color={CLIENT_TYPE_COLOR[c.client_type] || 'gray'}>
              {CLIENT_TYPES.find(t => t.value === c.client_type)?.label}
            </Badge>
            <Badge color={c.status === 'active' ? 'green' : 'red'}>{c.status}</Badge>
          </div>
          <p className="text-sm text-gray-500">{c.city}{c.state ? `, ${c.state}` : ''}</p>
        </div>
        <Link to={`/clients/${id}/edit`} className="btn-secondary btn-sm">
          <PencilIcon className="w-4 h-4" /> Edit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Visits', value: c.stats?.visit_count },
          { label: 'Opportunities', value: c.stats?.opp_count },
          { label: 'Pending Follow-ups', value: c.stats?.pending_followups },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="card lg:col-span-1">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Contact Details</h3></div>
          <div className="card-body">
            <InfoRow label="Contact Person" value={c.contact_person} />
            <InfoRow label="Designation" value={c.designation} />
            {c.mobile && (
              <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                <a href={`tel:${c.mobile}`} className="text-sm text-blue-600">{c.mobile}</a>
              </div>
            )}
            {c.email && (
              <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${c.email}`} className="text-sm text-blue-600">{c.email}</a>
              </div>
            )}
            {c.address && (
              <div className="flex items-start gap-2 py-2">
                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-700">{[c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ')}</span>
              </div>
            )}
            <InfoRow label="Industry" value={c.industry_type} />
            <InfoRow label="Salesperson" value={c.salesperson_name} />
            <InfoRow label="Manager" value={c.manager_name} />
            {c.notes && <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{c.notes}</div>}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="card lg:col-span-2 space-y-6">
          <div>
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Recent Visits</h3>
              <Link to={`/visits?client_id=${id}`} className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {visits?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No visits yet</p>}
              {visits?.map(v => (
                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.meeting_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{v.visit_date} · {v.person_met}</p>
                  </div>
                  <Badge color={v.approval_status === 'approved' ? 'green' : v.approval_status === 'rejected' ? 'red' : 'yellow'}>
                    {v.approval_status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Opportunities */}
          <div>
            <div className="card-header border-t border-gray-100">
              <h3 className="font-semibold text-gray-900">Opportunities</h3>
              <Link to={`/opportunities?client_id=${id}`} className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {opportunities?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No opportunities</p>}
              {opportunities?.map(o => (
                <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{o.title}</p>
                    <p className="text-xs text-gray-500">{o.brand_name} · ₹{Number(o.estimated_value || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <Badge color={OPPORTUNITY_STAGES.find(s => s.value === o.current_stage)?.color || 'gray'}>
                    {OPPORTUNITY_STAGES.find(s => s.value === o.current_stage)?.label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
