export type UserRoleInfo = {
  id?: number | null;
  name?: string | null;
};

export type UserSchedule = {
  start_time: string;
  end_time: string;
  source: string;
  special_schedule: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  phone_number?: string | null;
  profilePicture?: string | null;
  keterangan?: string | null;
  position_id?: number | null;
  position_name?: string | null;
  schedule?: UserSchedule;
  roleInfo?: UserRoleInfo;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: User;
};

export type WifiProof = {
  bssid?: string;
  ssid?: string;
  bssids?: string[];
  ssids?: string[];
};

export type AttendanceFlags = {
  late?: boolean;
  early_checkout?: boolean;
  special_schedule?: boolean;
};

export type AttendanceMinutes = {
  late?: number | null;
  early_checkout?: number | null;
};

export type AttendanceSchedule = {
  start_time: string;
  end_time: string;
  source: string;
};

export type AttendanceDashboardStatistics = {
  on_time?: number;
  late?: number;
  absent?: number;
  leave?: number;
  not_absent_out?: number;
  early_leave?: number;
};

export type AttendanceDashboardResponse = {
  month: string;
  statistics: AttendanceDashboardStatistics;
};

export type AttendanceCheckResponse = {
  ok: boolean;
  attendance_log_id: number;
  type: 'IN' | 'OUT';
  attendanceCategory?: 'REGULAR' | 'OUT_OF_TOWN';
  attendanceCategoryLabel?: string;
  dinasLocation?: string | null;
  notesText?: string | null;
  attachmentPath?: string | null;
  distanceMeters?: number | null;
  notes?: string[];
  flags?: AttendanceFlags;
  minutes?: AttendanceMinutes;
  schedule?: AttendanceSchedule;
  office?: { id: number; name: string };
};

// Status response subtypes
export type AttendanceStatusOffice = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  min_accuracy_m: number;
};

export type AttendanceStatusUserLocation = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type AttendanceStatusComputed = {
  inside_radius: boolean;
  distance_m: number;
  ip_ok: boolean;
  can_confirm: boolean;
  reasons: string[];
};

export type AttendanceStatusWifi = {
  has_rules: boolean;
  provided: boolean;
  ok: boolean;
};

export type AttendanceStatusSchedule = {
  start_time: string;
  end_time: string;
  source: string;
  late_threshold: string;
  early_threshold: string;
  is_special: boolean;
};

export type AttendanceStatusResponse = {
  office: AttendanceStatusOffice;
  user: AttendanceStatusUserLocation;
  computed: AttendanceStatusComputed;
  wifi: AttendanceStatusWifi;
  schedule: AttendanceStatusSchedule;
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
  user_agent: string | null;
  created_at: string;
  office_name: string | null;
  notes?: string[];
  flags?: AttendanceFlags;
  attendance_reason?: string | null;
  attachmentPath?: string | null;
  hasReasonOrAttachment?: boolean;
  reasonEligible?: boolean;
  attendanceCategory?: 'REGULAR' | 'OUT_OF_TOWN';
  attendanceCategoryLabel?: string;
  isOutOfTown?: boolean;
  dinasLocation?: string | null;
  notesText?: string | null;
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

export type LeaveApprovalProgressStep = {
  id: number;
  stepNo: number;
  stepName?: string | null;
  assignedApproverId?: number | null;
  assignedApproverName?: string | null;
  assignedApproverRole?: string | null;
  actualApproverId?: number | null;
  actualApproverName?: string | null;
  action: string;
  actionAt?: string | null;
  notes?: string | null;
};

export type LeaveDetail = {
  id: number;
  requestNo: string;
  requester: User;
  leaveTypeId: number;
  leaveTypeName: string | null;
  leaveTypeCode: string | null;
  requiresAttachment: number;
  maxDaysPerRequest: number | null;
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
  approvals: LeaveApprovalProgressStep[];
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

export type LeaveTypeWithQuotaItem = {
  id: number;
  code: string;
  name: string;
  requiresAttachment: boolean;
  maxDaysPerRequest: number | null;
  isActive: boolean;
  quotaTotalDays: number;
  quotaRemainingDays: number;
  quotaUsedDays: number;
  quotaStatus: string;
  canApply: boolean;
};

export type LeaveTypesResponse = {
  data: LeaveTypeWithQuotaItem[];
};

export type UploadResponse = {
  type: string;
  path: string;
  storedPath?: string;
  url?: string;
  filename: string;
  value?: string;
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
  schedule_source?: string;
  special_schedule?: boolean;
  dashboard_statistics?: AttendanceDashboardStatistics;
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
  first_in_category?: 'REGULAR' | 'OUT_OF_TOWN';
  last_out_category?: 'REGULAR' | 'OUT_OF_TOWN';
  first_in_category_label?: string;
  last_out_category_label?: string;
  first_in_is_out_of_town?: boolean;
  last_out_is_out_of_town?: boolean;
  late_reason?: string | null;
  late_attachment_path?: string | null;
  early_checkout_reason?: string | null;
  early_checkout_attachment_path?: string | null;
  first_in_proof_path?: string | null;
  last_out_proof_path?: string | null;
  out_of_town?: boolean;
  notes?: string[];
};

export type AttendanceReport = {
  summary: AttendanceRecap;
  daily: AttendanceReportDay[];
};

export type OfficeLocationConfig = {
  lat?: number;
  lng?: number;
};

export type OfficeAttendanceOverrideConfig = {
  requires_ip?: boolean;
  radius_m?: number;
  min_accuracy_m?: number;
};

export type OfficeWifiOverrideConfig = {
  allowed_bssids?: string[];
  allowed_ssids?: string[];
};

export type OfficeOverridesConfig = {
  attendance?: OfficeAttendanceOverrideConfig;
  wifi?: OfficeWifiOverrideConfig;
};

export type OfficeIpConfig = {
  allowed_cidrs?: string[];
};

export type OfficeConfig = {
  id: number;
  name: string;
  // Legacy location fields
  lat?: number;
  lng?: number;
  radius_m?: number;
  min_accuracy_m?: number;
  allowed_ip_cidrs?: string | string[] | null;
  // New location fields
  location?: OfficeLocationConfig;
  overrides?: OfficeOverridesConfig;
  ip?: OfficeIpConfig;
  // Backward-compatible Wi-Fi aliases
  allowed_bssids?: string[];
  allowed_ssids?: string[];
  wifi_bssids?: string[] | string;
  wifi_ssids?: string[] | string;
  wifi_bssid?: string;
  wifi_ssid?: string;
};

export type AttendanceConfig = {
  min_accuracy_m?: number;
  radius_m?: number;
  requires_ip?: boolean;
  response_times?: string[];
  history_days?: number;
  recap_months?: number;
};

export type WifiConfig = {
  allowed_bssids?: string[];
  allowed_ssids?: string[];
  bssids?: string[] | string;
  ssids?: string[] | string;
};

export type ConfigResponse = {
  office?: OfficeConfig;
  offices?: OfficeConfig[];
  attendance?: AttendanceConfig;
  wifi?: WifiConfig;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  role?: string;
  phone_number?: string | null;
  role_id?: number;
  role_name?: string;
  profilePicture?: string | null;
  keterangan?: string | null;
  position_id?: number | null;
  position_name?: string | null;
  schedule?: UserSchedule;
  roleInfo?: UserRoleInfo;
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

export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type OvertimeStatusRaw = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type OvertimeType = {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: number;
  requiresAttachment: number;
};

export type OvertimeRecord = {
  id: number;
  requestNo: string;
  overtimeTypeId: number;
  overtimeTypeName: string | null;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  reason: string;
  status: OvertimeStatus;
  statusRaw: OvertimeStatusRaw;
  attachmentPath: string | null;
};

export type OvertimeApprovalProgressStep = {
  id: number;
  stepNo: number;
  stepName?: string | null;
  assignedApproverId?: number | null;
  assignedApproverName?: string | null;
  actualApproverId?: number | null;
  actualApproverName?: string | null;
  action: string;
  actionAt?: string | null;
  notes?: string | null;
};

export type OvertimeDetail = OvertimeRecord & {
  requester: User;
  overtimeTypeCode: string | null;
  requiresAttachment: number;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  approvals: OvertimeApprovalProgressStep[];
};

// ─── Approval task list (approver inbox) ──────────────────────────────────────

export type ApprovalTaskCounts = {
  pending: number;
  returned: number;
  total: number;
};

export type ApprovalTaskListItem = {
  stepId: number;
  requestId?: number | null;
  requestNo?: string | null;
  module: string;
  requesterId?: number | null;
  requesterName?: string | null;
  reason?: string | null;
  stepNo?: number | null;
  stepName?: string | null;
  totalSteps?: number | null;
  currentStep?: number | null;
  action?: string | null;
  actionAt?: string | null;
  notes?: string | null;
  canTakeAction: boolean;
};

export type LeaveApprovalTaskItem = ApprovalTaskListItem & {
  requesterRole?: string | null;
  leaveTypeName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  daysCount?: number | null;
};

export type OvertimeApprovalTaskItem = ApprovalTaskListItem & {
  overtimeTypeName?: string | null;
  overtimeDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationHours?: number | null;
};

export type LeaveApprovalTaskListResponse = {
  status: string;
  limit: number;
  counts: ApprovalTaskCounts;
  data: LeaveApprovalTaskItem[];
};

export type OvertimeApprovalTaskListResponse = {
  status: string;
  limit: number;
  counts: ApprovalTaskCounts;
  data: OvertimeApprovalTaskItem[];
};

// ─── Approval detail (approver view) ──────────────────────────────────────────

export type ApprovalRequester = {
  id: number;
  name?: string | null;
  email?: string | null;
  positionName?: string | null;
};

export type ApprovalStepDetail = {
  id: number;
  stepNo: number;
  stepName?: string | null;
  action: string;
  actionAt?: string | null;
  notes?: string | null;
  canTakeAction: boolean;
};

export type ApprovalWorkflowDetail = {
  currentStep?: number | null;
  totalSteps?: number | null;
  status?: string | null;
};

export type LeaveApprovalRequestSummary = {
  id: number;
  requestNo: string;
  leaveTypeId: number;
  leaveTypeName?: string | null;
  leaveTypeCode?: string | null;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: string;
  statusRaw: string;
  attachmentPath?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OvertimeApprovalRequestSummary = {
  id: number;
  requestNo: string;
  overtimeTypeId: number;
  overtimeTypeName?: string | null;
  overtimeTypeCode?: string | null;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  reason: string;
  status: string;
  statusRaw: string;
  attachmentPath?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveApprovalDetailResponse = {
  step: ApprovalStepDetail;
  request: LeaveApprovalRequestSummary;
  requester: ApprovalRequester;
  workflow: ApprovalWorkflowDetail & { steps: LeaveApprovalProgressStep[] };
};

export type OvertimeApprovalDetailResponse = {
  step: ApprovalStepDetail;
  request: OvertimeApprovalRequestSummary;
  requester: ApprovalRequester;
  workflow: ApprovalWorkflowDetail & { steps: OvertimeApprovalProgressStep[] };
};

// ─── Approval action ──────────────────────────────────────────────────────────

export type ApprovalActionResponse = {
  success: boolean;
  message: string;
  action: string;
  isFinal: boolean;
  nextStep?: number | null;
  requestStatus?: string | null;
  requestStatusRaw?: string | null;
};

export type LeaveApprovalActionResponse = ApprovalActionResponse & {
  quotaWarning?: string | null;
};

// ─── Out-of-town attendance ───────────────────────────────────────────────────

export type OutOfTownCheckPayload = {
  dinasLocation?: string;
  notes?: string | null;
  attachmentPath: string;
  photoPath?: string;
};
