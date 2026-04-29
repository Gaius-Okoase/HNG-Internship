export interface GenderizeRes {
  count: number;
  name: string;
  gender: string | null;
  probability: number;
}

export interface CreatedProfile {
  status: string;
  data: {
    id: string;
    name: string;
    gender: string;
    gender_probability: number;
    sample_size: number;
    age: number;
    age_group: 'child' | 'teenager' | 'adult' | 'senior';
    country_id: string;
    country_probability: number;
    created_at: string;
  };
}

export interface AgifyRes {
  count: number;
  name: string;
  age: number;
}

/* The epected fields do not need to be in quotes as long as it's a valid identifier as seen in TS Doc */
type Country = {
  country_id: string;
  probability: number;
};

export interface NationalizeRes {
  count: number;
  name: string;
  country: Country[];
}

export interface IProfile {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: 'child' | 'teenager' | 'adult' | 'senior';
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export interface IUser {
  id: string;
  github_id: string;
  username: string;
  email: string | null;
  avatar_url: string;
  role: 'admin' | 'analyst';
  is_active: boolean;
  refresh_token: string;
  last_login_at: Date;
  created_at: Date;
}

export interface QueryOptionsSchema {
  q?: string | undefined;
  gender?: string | undefined;
  age_group?: string | undefined;
  country_id?: string | undefined;
  min_age?: number | undefined;
  max_age?: number | undefined;
  min_gender_probability?: number | undefined;
  min_country_probability?: number | undefined;
  sort_by?: 'age' | 'created_at' | 'gender_probability' | undefined;
  order?: 'asc' | 'desc' | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface Sort {
  field: string;
  order: 1 | -1;
}

export interface DecodedToken {
  id: string;
  role: 'admin' | 'analyst';
}
