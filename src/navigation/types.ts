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
};

export type AttendanceStackParamList = {
  AttendanceMain: undefined;
  AttendanceMonthlyDetail: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
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
