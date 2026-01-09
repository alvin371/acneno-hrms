export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
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

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

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

export type LeaveQuota = {
  total: number;
  remaining: number;
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
};

export type PerformanceRecord = {
  id: string;
  cycle: string;
  achievements: string;
  challenges: string;
  selfScore: number;
  notes?: string;
  createdAt: string;
};
