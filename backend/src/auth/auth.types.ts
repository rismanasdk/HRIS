export interface JwtPayload {
  sub: number;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user?: JwtPayload;
}