# 🚀 R2 文件管理系统

一个基于 Cloudflare Workers 和 R2 的现代化文件管理系统，支持文件上传、下载、移动、重命名等操作。

## ✨ 功能特性

- 🔓 **游客模式** - 未登录可浏览和下载文件
- 🔐 **管理员模式** - 登录后拥有完整管理权限
- 📤 **文件上传** - 支持多文件上传，带进度显示
- 🔄 **自动重试** - 网络不稳定时自动重试（最多5次）
- 📁 **文件夹管理** - 创建、移动、重命名文件夹
- 📦 **批量操作** - 批量下载、删除、移动文件
- 🎨 **现代化 UI** - 美观的渐变色界面
- ⚡ **零依赖** - 纯原生 JavaScript，无需构建工具

## 📸 预览

- **游客模式**：可浏览和下载文件
- **管理员模式**：完整的文件管理功能

## 🛠️ 技术栈

- **前端**: 原生 HTML + CSS + JavaScript
- **后端**: Cloudflare Workers
- **存储**: Cloudflare R2
- **认证**: Token-based (SHA-256)

## 📋 部署前准备

### 1. 注册 Cloudflare 账号

访问 [Cloudflare](https://dash.cloudflare.com/sign-up) 注册一个账号（免费版即可）。

### 2. 启用 R2 存储

1. 登录 Cloudflare Dashboard
2. 在左侧菜单找到 **R2 对象存储**
3. 点击 **购买 R2** 或 **开始使用**（免费额度：10GB 存储 + 1000万次读取/月）
4. 同意条款并启用 R2

## 🚀 部署步骤

### 方法一：使用 Cloudflare Dashboard（推荐新手）

#### 步骤 1: 创建 R2 存储桶

1. 进入 **R2 对象存储**
2. 点击 **创建存储桶**
3. 输入存储桶名称（例如：`my-file-storage`）
4. 选择位置（建议选择离你最近的区域）
5. 点击 **创建存储桶**

#### 步骤 2: 创建 R2 API Token

1. 在 R2 页面，点击 **管理 R2 API 令牌**
2. 点击 **创建 API 令牌**
3. 选择权限：
   - **对象读写** (Object Read & Write)
4. 选择适用的存储桶（选择刚创建的存储桶）
5. 点击 **创建 API 令牌**
6. **重要**：复制并保存以下信息：
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (格式：`https://账户ID.r2.cloudflarestorage.com`)

#### 步骤 3: 配置 R2 公共访问（用于下载）

1. 回到 R2 存储桶列表
2. 点击你的存储桶
3. 进入 **设置** 标签
4. 找到 **公共访问**
5. 点击 **连接域** 或 **允许访问**
6. 选择方式：
   - **选项 A**: 使用 R2.dev 子域（简单，但有限制）
     - 点击 **允许访问**
     - 获得类似 `https://pub-xxxx.r2.dev` 的域名
   - **选项 B**: 绑定自定义域名（推荐）
     - 点击 **连接域**
     - 输入你的域名（例如：`files.yourdomain.com`）
     - 添加相应的 DNS 记录

#### 步骤 4: 创建 Worker

1. 在 Cloudflare Dashboard 左侧菜单选择 **Workers 和 Pages**
2. 点击 **创建应用程序**
3. 选择 **创建 Worker**
4. 输入 Worker 名称（例如：`r2-file-manager`）
5. 点击 **部署**
6. 部署后点击 **编辑代码**

#### 步骤 5: 上传代码

1. 删除默认代码
2. 复制 `file_manager.js` 的完整内容
3. 粘贴到编辑器
4. 点击右上角 **保存并部署**

#### 步骤 6: 配置环境变量

1. 在 Worker 页面，点击 **设置** 标签
2. 找到 **变量** 部分
3. 点击 **添加变量**，依次添加：

| 变量名 | 类型 | 值 | 说明 |
|--------|------|-----|------|
| `ADMIN_PASSWORD` | 文本 | `your-secure-password` | 管理员密码 |
| `R2_PUBLIC_DOMAIN` | 文本 | `https://pub-xxxx.r2.dev` | R2 公共域名 |
| `R2_ACCOUNT_ID` | 文本 | `你的账户ID` | 从 R2 Endpoint 提取 |
| `R2_BUCKET_NAME` | 文本 | `my-file-storage` | 存储桶名称 |
| `R2_ACCESS_KEY_ID` | 文本 | `xxx` | R2 API Token |
| `R2_SECRET_ACCESS_KEY` | 加密 | `xxx` | R2 Secret Key |

4. 点击 **保存并部署**

#### 步骤 7: 绑定 R2 存储桶

1. 在 Worker 设置页面
2. 找到 **R2 存储桶绑定**
3. 点击 **添加绑定**
4. 输入：
   - **变量名称**: `MY_R2`
   - **R2 存储桶**: 选择你创建的存储桶
5. 点击 **保存**

#### 步骤 8: 绑定自定义域名（可选）

1. 在 Worker 页面，点击 **触发器** 标签
2. 点击 **添加自定义域**
3. 输入你的域名（例如：`manager.yourdomain.com`）
4. 点击 **添加自定义域**
5. Cloudflare 会自动配置 DNS

### 方法二：使用 Wrangler CLI（推荐开发者）

#### 步骤 1: 安装 Node.js 和 Wrangler

```bash
# 安装 Node.js (https://nodejs.org/)

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

#### 步骤 2: 创建项目

```bash
# 创建项目目录
mkdir r2-file-manager
cd r2-file-manager

# 初始化项目
wrangler init
```

#### 步骤 3: 配置 wrangler.toml

创建 `wrangler.toml` 文件：

```toml
name = "r2-file-manager"
main = "file_manager.js"
compatibility_date = "2024-01-01"

# R2 存储桶绑定
[[r2_buckets]]
binding = "MY_R2"
bucket_name = "my-file-storage"

# 环境变量
[vars]
R2_PUBLIC_DOMAIN = "https://pub-xxxx.r2.dev"
R2_ACCOUNT_ID = "your-account-id"
R2_BUCKET_NAME = "my-file-storage"
R2_ACCESS_KEY_ID = "your-access-key-id"

# 加密变量（使用 wrangler secret put 命令设置）
# ADMIN_PASSWORD
# R2_SECRET_ACCESS_KEY
```

#### 步骤 4: 设置加密变量

```bash
# 设置管理员密码
wrangler secret put ADMIN_PASSWORD

# 设置 R2 Secret Key
wrangler secret put R2_SECRET_ACCESS_KEY
```

#### 步骤 5: 创建 R2 存储桶

```bash
wrangler r2 bucket create my-file-storage
```

#### 步骤 6: 部署

```bash
# 复制 file_manager.js 到项目目录

# 部署到 Cloudflare
wrangler deploy
```

## 📝 配置说明

### 环境变量详解

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `ADMIN_PASSWORD` | ✅ | 管理员登录密码 | `MySecurePass123!` |
| `R2_PUBLIC_DOMAIN` | ✅ | R2 公共访问域名 | `https://pub-abc123.r2.dev` |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare 账户 ID | `1234567890abcdef` |
| `R2_BUCKET_NAME` | ✅ | R2 存储桶名称 | `my-file-storage` |
| `R2_ACCESS_KEY_ID` | ✅ | R2 API Access Key | `abc123...` |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 API Secret Key | `xyz789...` |

### 获取 Cloudflare 账户 ID

1. 登录 Cloudflare Dashboard
2. 选择任意网站或进入 Workers 页面
3. 在右侧找到 **账户 ID**
4. 或者从 R2 Endpoint URL 中提取：`https://[账户ID].r2.cloudflarestorage.com`

## 🎯 使用指南

### 游客模式

1. 访问你的 Worker 域名
2. 可以：
   - ✅ 浏览文件和文件夹
   - ✅ 下载文件
   - ✅ 复制文件链接
3. 不可以：
   - ❌ 上传文件
   - ❌ 删除文件
   - ❌ 移动/重命名文件

### 管理员模式

1. 点击右上角 **登录** 按钮
2. 输入管理员密码
3. 登录后可以：
   - ✅ 上传文件（支持多选）
   - ✅ 创建文件夹
   - ✅ 批量选择文件
   - ✅ 删除文件/文件夹
   - ✅ 移动文件/文件夹
   - ✅ 重命名文件/文件夹
   - ✅ 下载文件

### 快捷操作

- **全选**: 点击表格顶部的复选框
- **快速导航**: 点击面包屑导航快速跳转
- **取消上传**: 上传过程中可随时取消

## 🔧 高级配置

### 自定义上传重试次数

编辑 `file_manager.js` 第 206 行：

```javascript
const MAX_RETRIES = 5;  // 改为你想要的重试次数
```

### 修改上传延迟

编辑 `file_manager.js` 第 207 行：

```javascript
const RETRY_DELAY_BASE = 1000;  // 单位：毫秒
```

### 自定义主题颜色

编辑 CSS 部分，修改渐变色：

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🔒 安全建议

1. **强密码**: 使用复杂的管理员密码
2. **HTTPS**: Cloudflare 自动提供 HTTPS
3. **访问控制**: 可以在 Worker 中添加 IP 白名单
4. **定期备份**: 定期导出重要文件
5. **R2 Token**: 仅授予必要的权限

## 🐛 故障排查

### 问题 1: 无法访问 Worker

**解决方案**:
- 检查 Worker 是否部署成功
- 确认域名 DNS 已生效（最多需要 24 小时）
- 尝试使用 Worker 默认域名 `xxx.workers.dev`

### 问题 2: 上传失败

**解决方案**:
- 确认已登录管理员账户
- 检查 R2 存储桶绑定是否正确
- 查看浏览器控制台错误信息
- 确认环境变量配置正确

### 问题 3: 无法下载文件

**解决方案**:
- 确认 `R2_PUBLIC_DOMAIN` 配置正确
- 检查 R2 存储桶公共访问是否已启用
- 尝试直接访问 R2 公共域名测试

### 问题 4: 登录后立即退出

**解决方案**:
- 检查 `ADMIN_PASSWORD` 是否正确设置
- 清除浏览器缓存和 LocalStorage
- 确认 `/api/validate` 接口正常

## 📊 费用说明

### Cloudflare Workers 免费额度

- ✅ 每天 100,000 次请求
- ✅ 10ms CPU 时间/请求
- ✅ 完全免费

### Cloudflare R2 免费额度

- ✅ 10 GB 存储空间
- ✅ 1000 万次 A 类操作/月（写入、列表）
- ✅ 1 亿次 B 类操作/月（读取）
- ✅ 无出站流量费用

**超出免费额度后**:
- 存储: $0.015/GB/月
- A 类操作: $4.50/百万次
- B 类操作: $0.36/百万次

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

为 zhaozhenggang 定制开发

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 📅 更新日志

### v3.1 (2025-01-15)
- ✨ 新增游客模式
- ✨ 修复批量下载 bug
- ✨ 支持自动重试机制
- ✨ 优化上传体验
- 🔧 移除分片上传，简化代码

---

💡 **提示**: 如果觉得这个项目有用，请给个 ⭐ Star！
