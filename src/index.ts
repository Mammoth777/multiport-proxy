import express from 'express';
import path from 'path';
import { ConfigManager } from './server/config-manager';
import { Logger } from './server/logger';
import { ProxyServer } from './server/proxy-server';
import { createApiRouter } from './web/api-routes';

const WEB_PORT = 8888;

async function main() {
  console.log('🚀 Multiport Proxy Starting...\n');

  // 初始化管理模块
  const configManager = new ConfigManager();
  const logger = new Logger();
  const proxyServer = new ProxyServer(configManager, logger);

  // 启动代理服务
  proxyServer.startProxies();

  // 创建 Web 服务器
  const app = express();

  app.use(express.json());

  // 静态文件服务
  const uiDir = path.join(__dirname, 'web', 'ui');
  app.use(express.static(uiDir));

  // API 路由
  app.use('/api', createApiRouter(configManager, logger, proxyServer));

  // 根路径返回 HTML
  app.get('/', (req, res) => {
    res.sendFile(path.join(uiDir, 'index.html'));
  });

  // 启动 Web 服务器
  app.listen(WEB_PORT, async () => {
    console.log(`✓ Web UI running on http://localhost:${WEB_PORT}`);
    console.log(`✓ Running ports: ${proxyServer.getRunningPorts().join(', ') || 'none'}\n`);

    // 自动打开浏览器
    try {
      const open = (await import('open')).default;
      await open(`http://localhost:${WEB_PORT}`);
      console.log('✓ Browser opened automatically\n');
    } catch (error) {
      console.log(`Please open http://localhost:${WEB_PORT} in your browser\n`);
    }
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    proxyServer.stopAllProxies();
    process.exit(0);
  });
}

main().catch(console.error);
