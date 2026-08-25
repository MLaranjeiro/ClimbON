export interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_platform_admin: boolean;
  username_confirmed: boolean;
  profile_bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Gym {
  id: number;
  gym_name: string;
  slug: string;
  location_address: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  instagram_url: string | null;
  about_text: string | null;
  waiver_text: string | null;
  amenities: string[];
  logo_url: string | null;
  cover_image_url: string | null;
  map_image_url: string | null;
  created_at: string;
}

export type GymRole = 'gym_admin' | 'route_setter';

export interface GymMembership {
  id: number;
  user_id: string;
  gym_id: number;
  role: GymRole;
  created_at: string;
  gym?: Gym;
}

export type GymRoleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface GymRoleRequest {
  id: number;
  user_id: string;
  gym_id: number;
  requested_role: GymRole;
  status: GymRoleRequestStatus;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  gym?: Gym;
  profile?: Pick<UserProfile, 'id' | 'username'>;
}

export interface Section {
  id: number;
  gym_id: number;
  section_name: string;
  map_x: number | null;
  map_y: number | null;
  created_at: string;
}

export type RouteGrade = 'V0' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9' | 'V10';

export type RouteStatus = 'active' | 'inactive';

export interface Route {
  id: number;
  gym_id: number;
  section_id: number | null;
  route_name: string;
  grade: RouteGrade;
  status: RouteStatus;
  description: string | null;
  image_url: string | null;
  styles: string[];
  map_x: number | null;
  map_y: number | null;
  created_by: string;
  created_at: string;
  gym?: Gym;
  section?: Section;
  send_count?: number;
  avg_difficulty?: number | null;
}

export interface Send {
  id: number;
  user_id: string;
  route_id: number;
  date_completed: string;
  created_at: string;
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
