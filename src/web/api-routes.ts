import express, { Router, Request, Response } from 'express';
import * as net from 'net';
import { execSync } from 'child_process';
import { ConfigManager } from '../server/config-manager';
import { Logger } from '../server/logger';
import { ProxyServer } from '../server/proxy-server';

// 检查端口是否被占用
function checkPortAvailable(port: number): { available: boolean; details: string } {
  const isWindows = process.platform === 'win32';
  
  try {
    let command: string;
    let output: string;

    if (isWindows) {
      // Windows 使用 netstat
      command = `netstat -ano | findstr :${port}`;
      output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).toString();
    } else {
      // macOS 和 Linux 使用 lsof
      command = `lsof -i :${port}`;
      output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).toString();
    }

    if (output.trim()) {
      const lines = output.trim().split('\n');
      const details = lines.slice(1).map(line => line.trim()).join('\n');
      return {
        available: false,
        details: `端口 ${port} 已被占用\n\n程序信息:\n${details}`,
      };
    }

    return {
      available: true,
      details: `端口 ${port} 可用`,
    };
  } catch (error: any) {
    // 命令执行失败可能表示端口未被占用
    if (error.status === 1 || error.code === 1) {
      return {
        available: true,
        details: `端口 ${port} 可用`,
      };
    }

    // 其他错误
    return {
      available: false,
      details: `端口 ${port} 检查失败: ${error.message}`,
    };
  }
}

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
  router.post('/config/rules', async (req: Request, res: Response) => {
    try {
      const rule = req.body;
      if (!rule.id) {
        rule.id = Math.random().toString(36).slice(2);
      }
      rule.enabled = rule.enabled !== false;

      // 检查端口是否被占用
      const portCheck = checkPortAvailable(rule.localPort);
      if (!portCheck.available) {
        return res.status(400).json({
          error: 'Port unavailable',
          details: portCheck.details,
        });
      }

      configManager.addRule(rule);
      proxyServer.updateProxies();

      res.json({ success: true, rule });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 更新规则
  router.put('/config/rules/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // 获取旧规则
      const oldRule = configManager.getConfig().rules.find(r => r.id === id);
      const portChanged = oldRule && oldRule.localPort !== updates.localPort;

      // 如果端口改变了，需要检查新端口是否可用
      if (portChanged) {
        const portCheck = checkPortAvailable(updates.localPort);
        if (!portCheck.available) {
          return res.status(400).json({
            error: 'Port unavailable',
            details: portCheck.details,
          });
        }
      }

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
