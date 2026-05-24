export interface GithubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

export interface GithubUser {
  githubId: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string }>;
  avatar: string;
  accessToken: string;
}

export interface RequestWithUser {
  user: GithubUser;
}
