// types/admin.ts
export interface IWaitlistUser {
  _id: string;
  email: string;
  userWaitlistId: string;
  formResponses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IBetaUser {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WaitlistApiResponse extends ApiResponse<any> {
  users?: IWaitlistUser[];
  user?: IWaitlistUser;
}

export interface BetaUsersApiResponse extends ApiResponse<any> {
  users?: IBetaUser[];
  user?: IBetaUser;
}

// Custom hook for data fetching
export interface UseAdminDataReturn {
  waitlistUsers: IWaitlistUser[];
  betaUsers: IBetaUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Form data types
export interface AddToBetaRequest {
  email: string;
  userWaitlistId?: string;
}

export interface RemoveFromBetaRequest {
  userId: string;
}