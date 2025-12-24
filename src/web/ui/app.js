let currentEditingId = null;

// 启用 CORS 复选框的事件监听
document.addEventListener('DOMContentLoaded', () => {
  const corsCheckbox = document.getElementById('ruleCorsEnabled');
  const corsOrigins = document.getElementById('corsOrigins');
  
  corsCheckbox.addEventListener('change', (e) => {
    corsOrigins.style.display = e.target.checked ? 'block' : 'none';
  });

  // 初始化
  loadRules();
  loadLogs();
  
  // 定时刷新日志
  setInterval(loadLogs, 2000);

  // 日志筛选
  document.getElementById('logFilter').addEventListener('input', filterLogs);
});

// 加载规则列表
async function loadRules() {
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    const rules = data.rules || [];

    const rulesList = document.getElementById('rulesList');
    
    if (rules.length === 0) {
      rulesList.innerHTML = '<div class="loading">暂无规则，点击"新增规则"开始</div>';
      return;
    }

    rulesList.innerHTML = rules.map(rule => `
      <div class="rule-item" onclick="editRule('${rule.id}')">
        <div class="rule-item-header">
          <span class="rule-port">
            :${rule.localPort}
            <span class="rule-status ${rule.enabled ? 'enabled' : 'disabled'}"></span>
          </span>
        </div>
        <div class="rule-target">${rule.targetUrl}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load rules:', error);
  }
}

// 打开新增规则表单
function showAddRuleForm() {
  currentEditingId = null;
  document.getElementById('modalTitle').textContent = '新增代理规则';
  document.getElementById('deleteBtn').style.display = 'none';
  document.getElementById('ruleForm').reset();
  document.getElementById('ruleTimeout').value = '30000';
  document.getElementById('ruleRetries').value = '0';
  document.getElementById('ruleEnabled').checked = true;
  document.getElementById('ruleCorsEnabled').checked = false;
  document.getElementById('corsOrigins').style.display = 'none';
  document.getElementById('ruleModal').classList.add('show');
}

// 编辑规则
async function editRule(id) {
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    const rule = data.rules.find(r => r.id === id);

    if (!rule) return;

    currentEditingId = id;
    document.getElementById('modalTitle').textContent = '编辑代理规则';
    document.getElementById('deleteBtn').style.display = 'inline-block';
    document.getElementById('rulePort').value = rule.localPort;
    document.getElementById('ruleTarget').value = rule.targetUrl;
    document.getElementById('ruleTimeout').value = rule.timeout || 30000;
    document.getElementById('ruleRetries').value = rule.retries || 0;
    document.getElementById('ruleEnabled').checked = rule.enabled !== false;
    document.getElementById('ruleCorsEnabled').checked = rule.cors?.enabled || false;
    document.getElementById('ruleCorsOrigins').value = rule.cors?.origins?.join(', ') || '*';
    document.getElementById('corsOrigins').style.display = rule.cors?.enabled ? 'block' : 'none';

    document.getElementById('ruleModal').classList.add('show');
  } catch (error) {
    console.error('Failed to edit rule:', error);
  }
}

// 保存规则
async function saveRule(e) {
  e.preventDefault();

  const rule = {
    localPort: parseInt(document.getElementById('rulePort').value),
    targetUrl: document.getElementById('ruleTarget').value,
    timeout: parseInt(document.getElementById('ruleTimeout').value),
    retries: parseInt(document.getElementById('ruleRetries').value),
    enabled: document.getElementById('ruleEnabled').checked,
    cors: {
      enabled: document.getElementById('ruleCorsEnabled').checked,
      origins: document.getElementById('ruleCorsOrigins').value
        .split(',')
        .map(o => o.trim())
        .filter(o => o),
    },
  };

  try {
    if (currentEditingId) {
      // 更新规则
      const response = await fetch(`/api/config/rules/${currentEditingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }
    } else {
      // 新增规则
      const response = await fetch('/api/config/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error('Failed to add rule');
      }
    }

    closeRuleForm();
    loadRules();
    alert('规则已保存！');
  } catch (error) {
    console.error('Error saving rule:', error);
    alert('保存失败：' + error.message);
  }
}

// 删除规则
async function deleteRule() {
  if (!currentEditingId) return;

  if (!confirm('确定删除此规则吗？')) return;

  try {
    const response = await fetch(`/api/config/rules/${currentEditingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete rule');
    }

    closeRuleForm();
    loadRules();
    alert('规则已删除！');
  } catch (error) {
    console.error('Error deleting rule:', error);
    alert('删除失败：' + error.message);
  }
}

// 关闭表单
function closeRuleForm() {
  document.getElementById('ruleModal').classList.remove('show');
  currentEditingId = null;
}

// 加载日志
async function loadLogs() {
  try {
    const response = await fetch('/api/logs');
    const data = await response.json();
    const logs = data.logs || [];

    // 更新统计信息
    if (data.stats) {
      document.getElementById('totalLogs').textContent = data.stats.totalLogs;
      document.getElementById('errorCount').textContent = data.stats.errorCount;
      document.getElementById('avgDuration').textContent = data.stats.averageDuration + 'ms';
    }

    // 渲染日志
    const logsContainer = document.getElementById('logsContainer');
    if (logs.length === 0) {
      logsContainer.innerHTML = '<div class="log-entry"><p style="text-align: center; color: #999;">暂无日志</p></div>';
      return;
    }

    logsContainer.innerHTML = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('zh-CN');
      const statusClass = log.error ? 'error' : 'success';
      const statusText = log.statusCode || (log.error ? 'ERROR' : '?');
      const duration = log.duration.toFixed(0);

      return `
        <div class="log-entry">
          <span class="log-time">${time}</span>
          <span class="log-port">:${log.localPort}</span>
          <span class="log-method ${log.method}">${log.method}</span>
          <span>${log.path}</span>
          <span class="log-status ${statusClass}">${statusText}</span>
          <span class="log-duration">${duration}ms</span>
          ${log.error ? `<span style="color: #ef4444; margin-left: 10px;">⚠️ ${log.error}</span>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load logs:', error);
  }
}

// 筛选日志
function filterLogs() {
  const filter = document.getElementById('logFilter').value.toLowerCase();
  const entries = document.querySelectorAll('.log-entry');

  entries.forEach(entry => {
    const text = entry.textContent.toLowerCase();
    entry.style.display = text.includes(filter) ? '' : 'none';
  });
}

// 清空日志
async function clearLogs() {
  if (!confirm('确定清空所有日志吗？')) return;

  try {
    const response = await fetch('/api/logs', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear logs');
    }

    loadLogs();
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}
