export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Performance: undefined;
  Profile: undefined;
  Overtime: undefined;
  Approvals: undefined;
  Notifications: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
};

export type AttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceMonthlyDetail: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  EditPassword: undefined;
  Config: undefined;
  NotificationSettings: undefined;
};

export type LeaveStackParamList = {
  LeaveList: undefined;
  LeaveCreate: undefined;
  LeaveDetail: { id: number };
};

export type PerformanceStackParamList = {
  PerformanceList: undefined;
  PerformanceCreate: undefined;
  PerformanceDetail: { id: number };
};

export type OvertimeStackParamList = {
  OvertimeRequest: undefined;
  OvertimeDetail: { id: number };
};

export type ApprovalStackParamList = {
  ApprovalsList: undefined;
  ApprovalDetail: { stepId: number; module: 'leave' | 'overtime' };
};
