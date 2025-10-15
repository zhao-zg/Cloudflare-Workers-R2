# 🚀 R2 文件管理系统

基于 **Cloudflare Workers + R2** 的轻量文件管理面板。  
未登录：浏览 / 下载；登录：上传、删除、移动、重命名、批量操作。

---

## ✨ 功能

- 游客：浏览文件 & 文件夹、下载、（可选）复制直链
- 管理员：以上全部 + 上传（多文件）、创建文件夹、批量选择、移动、重命名、删除
- 自动重试上传（指数退避 1s/2s/4s/8s/16s）
- 纯前端界面 + Worker 代理后端（不暴露密钥）
- 零构建依赖，直接粘贴部署

---

## 🏗 架构模式（当前：代理模式）

浏览器 → Worker（鉴权+操作）→ R2  
无需 R2 Access Key 暴露，配置简单。

> 想做“浏览器直传”才需要额外变量（账户 ID、Access Key 等），此版本不需要。

---

## ✅ 必要配置

| 类型 | 名称 | 说明 |
|------|------|------|
| 环境变量 | `ADMIN_PASSWORD` | 管理员登录密码 |
| R2 绑定 | `MY_R2` | Worker 绑定的 R2 存储桶 |

可选：

| 名称 | 说明 | 作用 |
|------|------|------|
| `R2_PUBLIC_DOMAIN` | R2 公共域名（`https://pub-xxxx.r2.dev` 或自定义域） | 复制直链 / 直接下载 |

未配置 `R2_PUBLIC_DOMAIN` 时，建议隐藏“复制链接”按钮或后续添加下载代理接口。

---

## 🚀 Cloudflare Dashboard 部署

1. 创建 R2 存储桶：进入 R2 → Create Bucket（例如：`my-files`）
2. 创建 Worker：Workers & Pages → Create Worker → 命名 → 部署
3. 绑定 R2：
   - Worker → Settings → R2 buckets → Add binding
   - 变量名：`MY_R2`，选择存储桶
4. 添加变量：
   - Worker → Settings → Variables → 添加 `ADMIN_PASSWORD`
   - 可选添加 `R2_PUBLIC_DOMAIN`
5. 替换代码：Quick Edit → 粘贴 `_worker.js` 全量代码 → 保存
6. 访问：`https://<your-worker>.workers.dev`

---

## 🧪 Wrangler CLI 部署（可选）

```bash
npm install -g wrangler
wrangler login

mkdir r2-file-manager && cd r2-file-manager
# 放入 file_manager.js

cat > wrangler.toml <<'EOF'
name = "r2-file-manager"
main = "file_manager.js"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "MY_R2"
bucket_name = "my-files"

[vars]
# 可选：直链域名
# R2_PUBLIC_DOMAIN = "https://pub-xxxx.r2.dev"
EOF

wrangler secret put ADMIN_PASSWORD
wrangler deploy
```

---

## 🖥 使用

| 操作 | 说明 |
|------|------|
| 登录 | 右上角“登录”输入密码 |
| 上传 | 登录后点“上传文件” |
| 批量操作 | 勾选复选框后执行移动 / 删除 / 下载 |
| 移动 | 支持输入新路径或选择已有目录 |
| 重命名 | 单文件/文件夹行内按钮 |
| 下载 | 直接触发浏览器下载（依赖公共域名直链） |

---

## 🔐 安全建议

- 使用强密码（≥12 位）
- 不想公开文件：不要配置 `R2_PUBLIC_DOMAIN`
- 需要受控下载：后续可加 `/api/download` 代理流式输出
- 可在 Worker 中增加简单 IP 白名单逻辑

---

## 🛠 常见问题

| 问题 | 排查 |
|------|------|
| 登录后仍是游客 | 检查 `ADMIN_PASSWORD` 是否配置正确 |
| 上传失败 | 查看浏览器 Network；Worker 日志；确认已登录 |
| 下载 404 | 检查对象 key / `R2_PUBLIC_DOMAIN` 是否正确 |

---

## 📦 可选增强（未内置）

| 增强 | 描述 |
|------|------|
| 代理下载端点 | 屏蔽真实存储结构，统一鉴权 |
| 临时签名链接 | 限时共享文件 |
| 回收站 | 删除时移动到 `.trash/` |
| Zip 打包下载 | Worker 流式压缩（需控制 CPU 时间） |

---

## 📄 许可证

MIT

---

> 如需“直传 + 分片续传”进阶版或代理下载功能，后续告诉我即可。
