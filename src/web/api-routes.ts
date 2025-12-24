import express, { Router, Request, Response } from 'express';
import { ConfigManager } from '../server/config-manager';
import { Logger } from '../server/logger';
import { ProxyServer } from '../server/proxy-server';

export function createApiRouter(
  configManager: ConfigManager,
  logger: Logger,
  proxyServer: ProxyServer
): Router {
  const router = express.Router();

  // 获取所有配置
  router.get('/config', (req: Request, res: Response) => {
    res.json(configManager.getConfig());
  });

  // 保存配置
  router.post('/config', (req: Request, res: Response) => {
    try {
      const { rules } = req.body;
      if (!Array.isArray(rules)) {
        return res.status(400).json({ error: 'Invalid rules format' });
      }

      configManager.setRules(rules);
      proxyServer.updateProxies();

      res.json({ success: true, message: 'Config saved' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 添加规则
  router.post('/config/rules', (req: Request, res: Response) => {
    try {
      const rule = req.body;
      if (!rule.id) {
        rule.id = Math.random().toString(36).slice(2);
      }
      rule.enabled = rule.enabled !== false;

      configManager.addRule(rule);
      proxyServer.updateProxies();

      res.json({ success: true, rule });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 更新规则
  router.put('/config/rules/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      configManager.updateRule(id, updates);
      proxyServer.updateProxies();

      res.json({ success: true, message: 'Rule updated' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 删除规则
  router.delete('/config/rules/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      configManager.deleteRule(id);
      proxyServer.updateProxies();

      res.json({ success: true, message: 'Rule deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取日志
  router.get('/logs', (req: Request, res: Response) => {
    try {
      const { limit = '100', offset = '0', port, statusCode } = req.query;

      let logs;
      if (port) {
        logs = logger.getLogsByPort(parseInt(port as string), parseInt(limit as string));
      } else if (statusCode) {
        logs = logger.getLogsByStatusCode(parseInt(statusCode as string), parseInt(limit as string));
      } else {
        logs = logger.getLogs(parseInt(limit as string), parseInt(offset as string));
      }

      res.json({
        logs,
        stats: logger.getStats(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 清空日志
  router.delete('/logs', (req: Request, res: Response) => {
    try {
      logger.clearLogs();
      res.json({ success: true, message: 'Logs cleared' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取运行状态
  router.get('/status', (req: Request, res: Response) => {
    res.json({
      runningPorts: proxyServer.getRunningPorts(),
      stats: logger.getStats(),
    });
  });

  return router;
}
