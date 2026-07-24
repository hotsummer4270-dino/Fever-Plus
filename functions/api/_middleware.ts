import cloudflareAccessPlugin from '@cloudflare/pages-plugin-cloudflare-access';
import { apiError } from '../lib/http';
import type { Env, RequestData } from '../lib/types';

export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
  const { env, request } = context;
  const localActor = request.headers.get('x-fever-local-email');
  const allowedEmails = [env.ALLOWED_ACCESS_EMAIL, env.ALLOWED_ACCESS_EMAILS]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Local emulation is explicit and unavailable in Pages preview/production.
  if (env.APP_ENV === 'development' && env.ALLOW_LOCAL_AUTH === 'true' && localActor) {
    if (!allowedEmails.includes(localActor.toLowerCase())) return apiError(403, '当前本地账号未获授权。');
    context.data.actorEmail = localActor;
    return context.next();
  }

  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || allowedEmails.length === 0) {
    return apiError(503, 'Cloudflare Access 尚未配置完成。');
  }

  const access = cloudflareAccessPlugin({
    domain: env.ACCESS_TEAM_DOMAIN,
    aud: env.ACCESS_AUD,
  });

  return access({
    ...context,
    next: async () => {
      const payload = (context.data as RequestData & {
        cloudflareAccess?: { JWT?: { payload?: { email?: string } } };
      }).cloudflareAccess?.JWT?.payload;
      const email = payload?.email?.toLowerCase();
      if (!email || !allowedEmails.includes(email)) {
        return apiError(403, '此邮箱没有访问本工作台的权限。');
      }
      context.data.actorEmail = email;
      return context.next();
    },
  });
};
