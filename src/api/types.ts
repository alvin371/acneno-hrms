export type User = {
  id: string;
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
  id: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    distanceMeters: number;
  };
};

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type LeaveRecord = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
};

export type LeaveQuota = {
  total: number;
  remaining: number;
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
