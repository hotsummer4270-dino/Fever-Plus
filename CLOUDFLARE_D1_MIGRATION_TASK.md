# Task: 将 Fever Plus 迁移为 Cloudflare 云同步版本

## 目标

将当前仅保存浏览器本地数据的 Fever Plus，迁移为可由力王和花花两人跨设备共同使用的云端账本。

不要购买或维护 VPS、传统服务器、Docker 主机。使用 Cloudflare Pages、Pages Functions、D1 和 Cloudflare Access 完成全部前端托管、后端 API、数据库和登录保护。

当前线上域名为 `gym.madecappy.com`，当前 Vercel 版本必须保持可用，直到 Cloudflare 预览环境验证通过并取得用户明确同意后，才能切换生产域名。

## 产品边界

- 只有两位使用者：力王、花花；两人权限完全相同。
- 核心数据：学员、课包、共享课包、收款、消课、赠送课时、应收金额、实收金额、备注、训练计划。
- 不做预约排课、教练对账、体测、续费任务、复杂 CRM。
- 课包默认无限有效期；保留冻结状态。
- 必须保留现有导入/导出 JSON 备份能力。
- 现有本地数据必须能一次性迁移到云端，且不能丢失。

## 已确定的技术方案

```text
浏览器
  -> Cloudflare Access（仅一个共享授权邮箱）
  -> Cloudflare Pages（Vite 静态站点）
  -> Pages Functions（同域 /api/*）
  -> Cloudflare D1（SQLite 云数据库）
```

- 不使用 Vercel Functions、Supabase、Firebase 或自建服务器。
- 网站和 API 必须同域，均使用 `gym.madecappy.com`，不要额外创建跨域 API 域名。
- 使用 Cloudflare Access 的邮箱 OTP 或现有身份提供商登录，替换当前前端硬编码 PIN。
- Pages Function 必须校验 `Cf-Access-Jwt-Assertion`；不要仅信任浏览器传来的邮箱或教练名称。
- 在 Worker/Function 中通过私密环境变量配置一个允许邮箱；任何其他身份返回 403。
- Access 只负责确认工作室访问权。进入应用后由使用者选择当前记账人 `力王` 或 `花花`，写入记录时同时保存 Access 邮箱和所选教练。
- 因为两人共用一个授权邮箱，Access 审计只能识别这个共享邮箱，无法独立证明实际操作人；产品内的教练身份以每次登录后的主动选择为准。
- 不要把 API Token、Access AUD、邮箱、密钥或 D1 数据库 ID 硬编码进前端或提交到 Git。

## 用户需要提供或确认的内容

在确实需要时再向用户索取，避免一开始就要求所有权限：

1. 一个用于 Cloudflare Access 的共享授权邮箱。用户已在对话中提供，但不得把真实邮箱写入代码、migration、文档示例或 Git 历史；只在部署时配置。
2. 已登录的 Cloudflare 账户，或具有最小权限的 API Token。
3. 创建 D1、Pages 项目、Access 应用所需的 Cloudflare 权限。
4. 在最终切换 `gym.madecappy.com` 前的明确确认。

## 数据库设计

创建版本化 SQL migration，存放在 `migrations/`。不要把完整 `GymState` 作为单个 JSON 文档长期保存；收款和消课是账本数据，需要独立表和可追溯事务。

至少建立以下表并使用 UUID/text ID，与当前前端 ID 兼容：

- `app_users(email primary key, enabled, created_at)`
- `members(id primary key, name, phone, gender, avatar, join_date, note, status, created_at, updated_at)`
- `course_packs(id primary key, name, purchased_sessions, gifted_sessions, remaining_purchased_sessions, remaining_gifted_sessions, price, purchase_date, expires_at nullable, status, created_at, updated_at)`
- `course_pack_members(course_pack_id, member_id, primary key(course_pack_id, member_id))`
- `payment_logs(id primary key, course_pack_id, course_pack_name, amount, receivable_amount, discount_amount, discount_reason, pay_date, payer_name, payment_method, note, receiver, actor_email, created_at)`
- `class_logs(id primary key, member_id, member_name, coach, course_pack_id, course_pack_name, date, duration, content, session_count, deducted_purchased_sessions, deducted_gifted_sessions, actor_email, created_at)`
- `training_plans(id primary key, member_id, title, created_at, updated_at, days_json, is_active)`

为常用筛选建立索引：`class_logs(member_id, date desc)`、`payment_logs(pay_date desc)`、`course_pack_members(member_id)`、`course_packs(status)`。

## API 要求

实现同域 Pages Functions，统一返回 JSON 错误结构，使用参数化 SQL 和输入验证。

- `GET /api/me`：返回已验证邮箱和可选记账人 `力王`、`花花`，不根据共享邮箱自动推断教练。
- `GET /api/bootstrap`：返回当前完整工作室数据，供前端首次加载。
- 学员的创建、更新与查询 API。
- 课包查询 API。
- `POST /api/payments`：在一个 D1 batch/事务中创建课包、共享关系和收款记录。
- `POST /api/classes`：校验课包可用、优先扣已购课时、再扣赠送课时，并在同一事务中写入消课记录。
- `POST /api/classes/:id/undo`：在同一事务中恢复原课时拆分并删除消课记录。
- 训练计划的读取、保存、启用和删除 API。
- `POST /api/import`：只允许首次迁移或显式管理员操作；导入前校验 JSON，事务失败时必须整体回滚。
- `GET /api/export`：生成与当前备份格式兼容的完整 JSON。

禁止提供任意 SQL 执行接口。所有写入 API 必须服务端重新计算课时余额，不能信任客户端传来的剩余课时。

## 前端改造要求

1. 新增 API client 与明确的 loading、offline、error、retry 状态。
2. 初次进入时先调用 `/api/me`；Access 负责身份验证。保留“力王/花花”选择页，但移除 PIN 输入和前端硬编码 PIN，选择完成后再调用 `/api/bootstrap`。
3. 本地 `localStorage` 只作为离线缓存和迁移来源，不再是云端模式的权威数据。
4. 写操作成功后以服务端返回的数据更新界面；失败时不得乐观覆盖云端账本。
5. 若网络失败，明确显示“未同步”，不伪装成已经保存。
6. 导入本地旧数据前，展示摘要和明确确认；云端已有数据时禁止静默覆盖。
7. 保留现有界面结构与功能：工作台、学员、记录、数据；不要趁迁移重做 UI。

## 权限与安全要求

- 在 Cloudflare Zero Trust 中为 `gym.madecappy.com` 建立 Self-hosted Application。
- Access policy 仅允许用户提供的一个精确邮箱；不能仅按 `@qq.com` 等邮箱域名放行。
- Pages Function 使用 Cloudflare Access 插件或等效的 JWT 签名、issuer、AUD 验证。
- 禁用不受 Access 保护的 Worker 直连入口，例如不公开 `workers.dev` 路由。
- API 响应不暴露 Access token、环境变量或内部错误堆栈。
- 手机号和收款记录属于私密数据，所有 API 必须在身份验证后才能访问。

## 本地开发与部署

- 加入 `wrangler`、类型生成和开发脚本；用 `wrangler pages dev dist` 加载本地 D1 binding。
- 将 `wrangler.jsonc` 或等效配置提交到仓库，但只提交 binding 名称和非敏感配置。
- D1 database ID、Access AUD、单个允许邮箱等使用 Cloudflare Pages 的 encrypted secrets/variables 配置。
- 配置 GitHub -> Cloudflare Pages 自动部署，构建命令为 `npm run build`，输出目录为 `dist`。
- 在 Pages 预览 URL 完成完整验收后，再请求用户确认域名切换。
- 切换后验证 `https://gym.madecappy.com`、Access 登录、两台设备同步、导入、导出、收款、消课和撤销。
- Vercel 项目在验证完成后保留为回退入口，不要立即删除。

## 验收标准

1. 力王在设备 A 新增收款/课包后，花花在设备 B 刷新即可看到相同记录和课时余额。
2. 两人同时操作时，不能出现消课重复扣减或撤销多退课时。
3. 已购课时、赠送课时、应收、实收、共享学员、无限有效期和冻结状态均完整保存。
4. 未通过 Access 或邮箱不是唯一授权邮箱时，页面和 API 都无法访问。
5. 当前浏览器中的旧 JSON 能导入一次，导入后统计数字与记录数量一致。
6. `npm run lint`、`npm run build`、API 单元/集成测试及桌面/手机浏览器验收全部通过。
7. 生产域名切换前必须由用户明确确认；切换后保留 Vercel 回退路径。

## 执行顺序

1. 先审查现有数据模型和导入导出格式，制定 migration 与映射。
2. 实现 D1 schema、Pages Functions、JWT 校验与本地测试。
3. 改造前端为云端读取与写入，保留本地迁移工具。
4. 部署到 Cloudflare Pages 预览环境，进行双浏览器验收。
5. 使用用户私下提供的一个邮箱配置 Access；不要将邮箱写入仓库。
6. 由用户确认后，导入真实数据并切换 `gym.madecappy.com`。
7. 验证生产环境后再决定是否停止 Vercel。

## 完成时需要交付

- 所有代码、D1 migrations、配置和测试。
- 不含敏感信息的 `.env.example`。
- 真实部署地址、Cloudflare 项目名称、D1 database 名称。
- 本地 JSON 到云端的迁移说明与一次回退说明。
- 数据同步、Access 登录、核心收款/消课流程的验证结果。
