# NPM 发布指南

## 发布前检查清单

### 1. 完善 package.json 信息

确保以下字段已正确填写：

```json
{
  "name": "@jachy/multiport-proxy",
  "version": "1.0.0",
  "description": "A multi-port proxy server with web UI configuration",
  "author": "Your Name <your.email@example.com>",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/multiport-proxy.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/multiport-proxy/issues"
  },
  "homepage": "https://github.com/yourusername/multiport-proxy#readme"
}
```

### 2. 测试本地构建

```bash
# 构建项目
pnpm run build

# 测试构建后的 CLI
node dist/cli.js
```

### 3. 测试 npx 本地运行

```bash
# 在项目根目录
npm link

# 在另一个目录测试
multiport-proxy

# 取消链接
npm unlink -g @jachy/multiport-proxy
```

### 4. 检查要发布的文件

```bash
# 查看将要发布的文件列表
npm pack --dry-run

# 实际打包（会生成 .tgz 文件）
npm pack
```

### 5. 发布到 NPM

#### 首次发布

```bash
# 登录 npm（如果还没登录）
npm login

# 发布（scoped package 需要 --access public）
npm publish --access public
```

#### 后续版本发布

```bash
# 更新版本号（自动更新 package.json）
npm version patch  # 1.0.0 -> 1.0.1
# 或
npm version minor  # 1.0.0 -> 1.1.0
# 或
npm version major  # 1.0.0 -> 2.0.0

# 发布新版本
npm publish --access public

# 推送 git tag
git push --follow-tags
```

## 发布后验证

### 1. 验证包是否可以安装

```bash
# 使用 npx 运行
npx @jachy/multiport-proxy

# 或全局安装
npm install -g @jachy/multiport-proxy
multiport-proxy
```

### 2. 检查 npm 页面

访问: https://www.npmjs.com/package/@jachy/multiport-proxy

确认：
- 版本号正确
- README 显示正确
- 文件列表正确

## 常见问题

### Q: 如何修改包名？

修改 `package.json` 中的 `name` 字段，然后重新发布。

### Q: 如何撤销已发布的版本？

```bash
# 只能撤销 72 小时内发布的版本
npm unpublish @jachy/multiport-proxy@1.0.0

# 或撤销整个包
npm unpublish @jachy/multiport-proxy --force
```

### Q: 如何发布 beta 版本？

```bash
# 更新版本为 beta
npm version prerelease --preid=beta

# 发布为 beta tag
npm publish --tag beta --access public

# 用户使用 beta 版本
npx @jachy/multiport-proxy@beta
```

### Q: 包名被占用怎么办？

- 使用 scoped package: `@your-username/package-name`
- 或选择其他可用的包名

## 自动化发布（可选）

可以配置 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
