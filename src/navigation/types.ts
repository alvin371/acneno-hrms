export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Performance: undefined;
  Profile: undefined;
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
