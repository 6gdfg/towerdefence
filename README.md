# Tower Defence

一个基于 React + TypeScript + Vite 的极简塔防游戏。项目包含账号、关卡、宝箱、植物/元素升级、图鉴、挑战和本地平衡实验室等功能。

## 功能概览

- 主线章节与关卡难度：`EZ / HD / IN / AT`。
- 植物、元素、怪物拥有独立数值和特殊机制。
- 账号系统使用用户名和密码，进度存储在 Postgres。
- 宝箱、碎片、金币、钻石和关卡奖励由后端 API 处理。
- 平衡实验室可在本地调试关卡，并保存为代码里的生成配置。

## 本地开发

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run check
```

数据库迁移：

```bash
npm run db:migrate
```

## 环境变量

参考 `.env.example`：

- `POSTGRES_URL`：Vercel Storage / Postgres 连接串。
- `DATABASE_URL`：本地开发时可作为替代连接串。
- `AUTH_SECRET`：账号登录 token 的密钥；部署环境已有就不用改。

兼容变量：`AUTHSECRET`、`authsecret`、`JWT_SECRET`。

## Vercel 部署

项目部署在 Vercel 上，`vercel.json` 会使用：

```bash
npm run vercel-build
```

这个命令会先执行数据库迁移，再构建前端，所以通常不需要手动复制 SQL。

## 平衡实验室

本地 dev server 中的实验室可以保存关卡草稿，生成配置会写入：

- `src/td/balanceDraft.generated.ts`
- `shared/unlockDraft.generated.ts`

关卡数值、难度定数、怪物波次、AT 模式和通关解锁奖励都以这些生成配置为准。

更完整的数值表见 `docs/game-data.md`。
