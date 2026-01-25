export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  role_id?: number;
  role_name?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: User;
};

export type AttendanceRecord = {
  id: number;
  user_id: number;
  office_id: number;
  type: 'IN' | 'OUT';
  lat: number;
  lng: number;
  accuracy: number;
  distance_m: number;
  method: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  office_name: string;
};

export type LeaveStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'PENDING_APPROVAL'
  | 'CANCELLED'
  | 'Cancelled';

export type LeaveRecord = {
  id: number;
  requestNo: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  attachmentPath?: string | null;
};

export type LeaveApproval = {
  id: number;
  leaveRequestId: number;
  stepNo: number;
  approverId: number;
  approverName: string;
  approverEmail: string;
  action: string;
  actionAt: string | null;
  notes: string | null;
};

export type LeaveDetail = {
  id: number;
  requestNo: string;
  requester: User;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  requiresAttachment: number;
  maxDaysPerRequest: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  statusRaw: string;
  currentStep: number;
  attachmentPath?: string | null;
  createdAt: string;
  updatedAt: string;
  approvals: LeaveApproval[];
};

export type LeaveQuotaSummary = {
  totalDays: number;
  remainingDays: number;
  usedDays: number;
};

export type LeaveQuotaItem = {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  totalDays: number;
  remainingDays: number;
  usedDays: number;
  percentageRemaining: number;
  status: string;
  updatedAt: string;
};

export type LeaveQuotaResponse = {
  summary: LeaveQuotaSummary;
  quotas: LeaveQuotaItem[];
};

export type UploadResponse = {
  type: string;
  path: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
};

export type Holiday = {
  id: number;
  date: string;
  name: string;
  dayName: string;
  isHoliday: boolean;
};

export type AttendanceRecap = {
  month: string;
  present_days: number;
  late_count: number;
  early_checkout_count: number;
  absent_count: number;
  leave_days: number;
  start_time: string;
  end_time: string;
};

export type AttendanceRecapAllEntry = AttendanceRecap & {
  user: User;
};

export type AttendanceReportDay = {
  date: string;
  status: string;
  first_in: string | null;
  last_out: string | null;
  late: boolean;
  early_checkout: boolean;
  holiday_name: string | null;
};

export type AttendanceReport = {
  summary: AttendanceRecap;
  daily: AttendanceReportDay[];
};

export type Holiday = {
  id: number;
  date: string;
  name: string;
  dayName: string;
  isHoliday: true;
};

export type OfficeConfig = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  min_accuracy_m: number;
  allowed_ip_cidrs?: string | null;
};

export type AttendanceConfig = {
  min_accuracy_m: number;
  radius_m: number;
  requires_ip: boolean;
  response_times: string[];
  history_days: number;
  recap_months: number;
};

export type WifiConfig = {
  allowed_bssids: string[];
  allowed_ssids: string[];
};

export type ConfigResponse = {
  office: OfficeConfig;
  attendance: AttendanceConfig;
  wifi: WifiConfig;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  role?: string;
  phone_number?: string | null;
  role_id?: number;
  role_name?: string;
};

export type PerformanceTemplateItem = {
  id: number;
  template_id: number;
  order_no: number;
  objective: string;
  kpi: string | null;
  target_value: number;
  unit: string | null;
  weight: number;
};

export type PerformanceTemplate = {
  id: number;
  name: string;
  period_year: number;
  department: string;
  is_active: number;
  role_id?: number;
  role_display_name?: string | null;
  employee_role_id?: number | null;
  employee_role_name?: string | null;
  items: PerformanceTemplateItem[];
};

export type PerformanceSubmissionStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CANCELED';

export type PerformanceSubmission = {
  id: number;
  template_id: number;
  employee_id: number;
  period_year: number;
  total_score: number;
  status: PerformanceSubmissionStatus;
  template_name: string;
};

export type PerformanceSubmissionItem = {
  id: number;
  template_item_id: number;
  objective: string;
  target_value: number;
  actual_value: number;
  weight: number;
  score_ratio: number;
  final_score: number;
};

export type PerformanceSubmissionDetail = {
  id: number;
  template_id: number;
  employee_id: number;
  template_name: string;
  period_year: number;
  total_score: number;
  status: PerformanceSubmissionStatus;
  items: PerformanceSubmissionItem[];
};
