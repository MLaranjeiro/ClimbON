export type UserRole = 'climber' | 'route_setter';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile_bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Gym {
  id: number;
  gym_name: string;
  location_address: string;
}

export type RouteGrade =
  | 'VB' | 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5'
  | 'V6' | 'V7' | 'V8' | 'V9' | 'V10' | 'V11' | 'V12';

export type RouteStatus = 'active' | 'inactive';

export interface Route {
  id: number;
  gym_id: number;
  route_name: string;
  grade: RouteGrade;
  status: RouteStatus;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  gym?: Gym;
  send_count?: number;
  avg_difficulty?: number | null;
}

export interface Send {
  id: number;
  user_id: string;
  route_id: number;
  date_completed: string;
  route?: Route;
  profile?: UserProfile;
}

export interface Beta {
  id: number;
  route_id: number;
  user_id: string;
  description_text: string | null;
  video_url: string | null;
  created_at: string;
  profile?: UserProfile;
}

export interface DifficultyRating {
  id: number;
  route_id: number;
  user_id: string;
  grade: number;
  created_at: string;
}
