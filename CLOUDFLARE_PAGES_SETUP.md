# Cloudflare Pages 配置说明

本仓库不会保存生产环境的 D1 数据库 ID、Access AUD、Token 或允许访问的邮箱地址。

## 已创建的预览资源

- 一个名为 `fever-plus` 的 Cloudflare D1 数据库。
- 一个名为 `fever-plus` 的 Cloudflare Pages 项目。
- 迁移分支上的首个 Pages 预览部署。
- 已在 Cloudflare 中设置允许邮箱的 Pages Secret，其具体值不保存在本仓库。

## 需要在 Cloudflare 控制台完成的配置

1. 打开 **Zero Trust**，为当前 Cloudflare 账号创建或选择团队。
2. 进入 **Access controls > Applications > Add an application > Self-hosted**。
3. 先添加稳定的 Pages 分支预览域名 `codex-cloudflare-d1-migratio.fever-plus.pages.dev`。不要使用带随机前缀的单次部署地址；只有在明确批准切换后，才能添加正式自定义域名。
4. 创建一条只允许指定邮箱访问的策略，并启用邮箱一次性验证码登录。
5. 复制该 Access 应用的 Audience（`AUD`）以及团队域名。
6. 进入 **Workers & Pages > fever-plus > Settings > Bindings**，在 Preview 和 Production 环境中都将 D1 数据库绑定为 `DB`。
7. 进入 **Settings > Variables and Secrets**，在 Preview 和 Production 环境中设置以下加密变量。通过 Wrangler 写入的 Secret 默认只进入 Production，Preview 需要在控制台单独补齐：
   - `ACCESS_TEAM_DOMAIN`：完整的 `https://<团队名>.cloudflareaccess.com` 域名。
   - `ACCESS_AUD`：Access 应用的 Audience。
   - `ALLOWED_ACCESS_EMAILS`：用英文逗号分隔多个允许登录的邮箱。请确认对应环境中存在该 Secret。
8. 如果使用 Git 自动部署，构建命令设为 `npm run build:pages`，输出目录设为 `dist`。

## 部署说明

- `wrangler.jsonc` 使用的是本地占位绑定，因此真实 D1 数据库 ID 不会提交到 Git。
- 使用 CLI 部署前，请在本机准备一个不提交的 Wrangler 配置，并填入真实 D1 绑定；或者先在 Cloudflare 控制台完成 `DB` 绑定后从控制台部署。
- 远端 migration 需要使用包含真实 D1 绑定的本地、未提交 Wrangler 配置运行：

```bash
wrangler d1 migrations apply DB --remote
```

## 安全边界

- 保留当前 Vercel 部署，不要停止或删除。
- 只有在 Cloudflare 预览环境通过 Access 登录后的完整流程验证，且得到明确批准后，才可以添加或切换 `gym.madecappy.com`。
