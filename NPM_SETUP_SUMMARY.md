# NPM 发布改造完成总结

## 已完成的改造

### 1. 文件结构调整

- ✅ 创建了 `src/cli.ts` 作为 CLI 入口文件（包含 shebang）
- ✅ 保留原有的 `src/index.ts` 作为模块入口

### 2. package.json 配置

添加了以下关键配置：

```json
{
  "bin": {
    "multiport-proxy": "dist/cli.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "prepublishOnly": "pnpm run build"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": { ... },
  "bugs": { ... },
  "homepage": { ... }
}
```

### 3. 构建优化

- ✅ 修改 build 脚本：`tsc && chmod +x dist/cli.js`
- ✅ 添加 `prepublishOnly` 钩子，发布前自动构建

### 4. 发布准备

- ✅ 创建 `.npmignore` 文件，排除不必要的文件
- ✅ 更新 README.md，添加 npx 使用说明
- ✅ 创建 `PUBLISH_GUIDE.md` 发布指南

### 5. 本地测试

- ✅ 构建成功
- ✅ CLI 可执行文件权限正确
- ✅ npm link 测试通过

## 使用方式

### 本地测试（已完成）

```bash
# 1. 全局链接
npm link

# 2. 运行命令
multiport-proxy

# 3. 取消链接（可选）
npm unlink -g @jachy/multiport-proxy
```

### 发布后用户使用

```bash
# 方式 1: npx 直接运行（推荐）
npx @jachy/multiport-proxy

# 方式 2: 全局安装
npm install -g @jachy/multiport-proxy
multiport-proxy
```

## 发布步骤

### 发布前准备

1. **完善 package.json 信息**
   - 填写 `author` 字段
   - 更新 `repository` URL（替换 `yourusername`）
   - 更新 `bugs` 和 `homepage` URL

2. **检查要发布的文件**
   ```bash
   npm pack --dry-run
   ```

### 正式发布

```bash
# 1. 登录 npm
npm login

# 2. 发布（scoped package 需要 --access public）
npm publish --access public
```

### 后续更新

```bash
# 更新版本
npm version patch  # 1.0.0 -> 1.0.1

# 发布
npm publish --access public

# 推送 git 标签
git push --follow-tags
```

## 注意事项

1. **包名说明**
   - 当前使用 scoped 包名：`@jachy/multiport-proxy`
   - 如果不需要 scope，可以改为：`multiport-proxy`（需要检查是否被占用）

2. **版本管理**
   - 遵循语义化版本（Semantic Versioning）
   - 使用 `npm version` 命令自动更新版本号

3. **文档维护**
   - 确保 README.md 内容完整
   - 更新 repository 链接为实际的 Git 仓库地址

4. **测试建议**
   - 发布前在本地充分测试
   - 可以先发布到私有 npm 或 verdaccio 测试

## 相关文档

- [PUBLISH_GUIDE.md](./PUBLISH_GUIDE.md) - 详细的发布指南
- [README.md](./README.md) - 用户使用文档

## 验证清单

- ✅ CLI 入口文件包含正确的 shebang
- ✅ dist/cli.js 有可执行权限
- ✅ npm link 本地测试通过
- ⚠️ package.json 的 repository/bugs/homepage URL 需要更新
- ⚠️ package.json 的 author 字段需要填写
- ⚠️ 需要在 npm 官网注册账号并登录

发布到 npm 后，用户就可以通过 `npx @jachy/multiport-proxy` 直接运行你的代理服务了！
