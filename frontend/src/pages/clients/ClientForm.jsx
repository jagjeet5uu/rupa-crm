import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { clientApi, masterApi, userApi } from '../../services/api';
import { CLIENT_TYPES } from '../../constants';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { status: 'active', client_type: 'new_prospect' }
  });

  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => masterApi.brands({ status: 'active' }).then(r => r.data.data) });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => masterApi.categories({ status: 'active' }).then(r => r.data.data) });
  const { data: salespeople } = useQuery({ queryKey: ['salespeople'], queryFn: () => userApi.list({ role: 'sales_executive', status: 'active' }).then(r => r.data.data) });

  const { data: existing } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientApi.get(id).then(r => r.data.data),
    enabled: isEdit,
    onSuccess: (data) => {
      Object.entries(data).forEach(([k, v]) => { if (v !== null) setValue(k, v); });
      if (data.brands) setValue('brands', data.brands.map(b => b.id));
      if (data.categories) setValue('categories', data.categories.map(c => c.id));
    }
  });

  const captureGPS = () => {
    setGpsLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        setValue('gps_captured_at', new Date().toISOString());
        toast.success('GPS captured');
        setGpsLoading(false);
      },
      () => { toast.error('GPS denied'); setGpsLoading(false); }
    );
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await clientApi.update(id, data);
        toast.success('Client updated');
      } else {
        const res = await clientApi.create(data);
        toast.success('Client created');
        navigate(`/clients/${res.data.data.id}`);
        return;
      }
      navigate(`/clients/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const lat = watch('latitude');
  const lng = watch('longitude');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Info */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Company Information</h3></div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company Name <span className="text-red-500">*</span></label>
              <input {...register('company_name', { required: 'Company name required' })} className={`input ${errors.company_name ? 'input-error' : ''}`} />
              {errors.company_name && <p className="form-error">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input {...register('contact_person')} className="input" />
            </div>
            <div>
              <label className="label">Designation</label>
              <input {...register('designation')} className="input" />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input {...register('mobile')} type="tel" className="input" />
            </div>
            <div>
              <label className="label">Alternate Mobile</label>
              <input {...register('alternate_mobile')} type="tel" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div>
              <label className="label">Industry Type</label>
              <input {...register('industry_type')} className="input" placeholder="e.g. Manufacturing" />
            </div>
            <div>
              <label className="label">Client Type</label>
              <select {...register('client_type')} className="input">
                {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Address & Location</h3>
            <button type="button" onClick={captureGPS} disabled={gpsLoading} className="btn-secondary btn-sm">
              {gpsLoading ? <Spinner size="sm" /> : <MapPinIcon className="w-4 h-4" />}
              {lat ? 'GPS Captured ✓' : 'Capture GPS'}
            </button>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <textarea {...register('address')} className="input" rows={2} />
            </div>
            <div>
              <label className="label">City</label>
              <input {...register('city')} className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input {...register('state')} className="input" />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input {...register('pincode')} className="input" />
            </div>
            {lat && lng && (
              <div className="sm:col-span-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                GPS: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Assignment */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Assignment & Interests</h3></div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Assigned Salesperson</label>
              <select {...register('assigned_salesperson_id')} className="input">
                <option value="">Select salesperson</option>
                {salespeople?.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="input" rows={2} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Spinner size="sm" /> Saving...</> : isEdit ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
