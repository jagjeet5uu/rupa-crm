export const API_BASE = '/api/v1';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager',
  SALES_EXECUTIVE: 'sales_executive',
  BACKEND_OPS: 'backend_ops',
  MANAGEMENT: 'management',
};

export const OPPORTUNITY_STAGES = [
  { value: 'identification', label: 'Identification', color: 'gray' },
  { value: 'qualified', label: 'Qualified', color: 'blue' },
  { value: 'evaluation', label: 'Evaluation', color: 'purple' },
  { value: 'quotation_sent', label: 'Quotation Sent', color: 'yellow' },
  { value: 'negotiation', label: 'Negotiation', color: 'orange' },
  { value: 'finalization', label: 'Finalization', color: 'indigo' },
  { value: 'won', label: 'Won', color: 'green' },
  { value: 'lost', label: 'Lost', color: 'red' },
];

export const MEETING_TYPES = [
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'demo', label: 'Demo' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'payment_follow_up', label: 'Payment Follow-up' },
  { value: 'order_discussion', label: 'Order Discussion' },
  { value: 'other', label: 'Other' },
];

export const CLIENT_TYPES = [
  { value: 'existing_client', label: 'Existing Client' },
  { value: 'new_prospect', label: 'New Prospect' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

export const VISIT_APPROVAL = {
  pending: { label: 'Pending', badge: 'badge-yellow' },
  approved: { label: 'Approved', badge: 'badge-green' },
  rejected: { label: 'Rejected', badge: 'badge-red' },
};

export const FOLLOWUP_PRIORITY = {
  low: { label: 'Low', badge: 'badge-gray' },
  medium: { label: 'Medium', badge: 'badge-blue' },
  high: { label: 'High', badge: 'badge-red' },
};

export const FOLLOWUP_STATUS = {
  pending: { label: 'Pending', badge: 'badge-yellow' },
  completed: { label: 'Completed', badge: 'badge-green' },
  overdue: { label: 'Overdue', badge: 'badge-red' },
  cancelled: { label: 'Cancelled', badge: 'badge-gray' },
};

export const QUOTATION_STATUS = {
  draft: 'badge-gray',
  sent: 'badge-blue',
  under_discussion: 'badge-yellow',
  accepted: 'badge-green',
  rejected: 'badge-red',
  converted: 'badge-purple',
  lost: 'badge-red',
};

export const PO_STATUS = {
  received: 'badge-blue',
  processing: 'badge-yellow',
  dispatched: 'badge-purple',
  completed: 'badge-green',
  cancelled: 'badge-red',
};
