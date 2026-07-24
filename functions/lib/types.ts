export interface Env {
  DB: D1Database;
  APP_ENV?: string;
  ALLOW_LOCAL_AUTH?: string;
  ALLOWED_ACCESS_EMAIL?: string;
  ALLOWED_ACCESS_EMAILS?: string;
  ACCESS_TEAM_DOMAIN?: `https://${string}.cloudflareaccess.com`;
  ACCESS_AUD?: string;
}

export interface RequestData extends Record<string, unknown> {
  actorEmail?: string;
}
