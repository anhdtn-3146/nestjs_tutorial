export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: string;
  sid: number;
  jti: string;
  type: 'access';
  iat: number;
  exp: number;
}
