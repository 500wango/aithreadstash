let latestChatData = null;
const conversationStore = new Map();
let conversationCounter = 1;
// 新增：下次预览是否自动打印
let autoPrintNextPreview = false;

/* Rollback: disable Pro Trial feature */ if (false) {
// 新增：Pro 试用相关常量与工具函数
const TRIAL_STORAGE_KEY = 'proTrialState';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7天
const TRIAL_PRE_END_BEFORE_MS = 24 * 60 * 60 * 1000; // 到期前24小时提醒

async function getTrialState() {
  return new Promise((resolve) => {
    chrome.storage.local.get([TRIAL_STORAGE_KEY], (res) => {
      const state = res?.[TRIAL_STORAGE_KEY] || null;
      resolve(state);
    });
  });
}

async function setTrialState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [TRIAL_STORAGE_KEY]: state }, () => resolve(true));
  });
}

function computeRemainingMs(state) {
  if (!state || !state.active || !state.endsAt) return 0;
  const ends = typeof state.endsAt === 'number' ? state.endsAt : Date.parse(state.endsAt);
  return Math.max(0, ends - Date.now());
}

function scheduleTrialAlarms(state) {
  try {
    // 清理旧闹钟
    chrome.alarms.clear('pro_trial_pre_end');
    chrome.alarms.clear('pro_trial_end');

    if (!state || !state.active) return;

    const now = Date.now();
    const endsAt = typeof state.endsAt === 'number' ? state.endsAt : Date.parse(state.endsAt);

    // 预结束时间：到期前24小时
    const preEndWhen = endsAt - TRIAL_PRE_END_BEFORE_MS;
    if (preEndWhen > now) {
      chrome.alarms.create('pro_trial_pre_end', { when: preEndWhen });
    } else {
      // 若已经过了预提醒时间但未到期，则立即触发一次预提醒
      if (endsAt > now) chrome.alarms.create('pro_trial_pre_end', { when: now + 2000 });
    }

    // 结束时间
    if (endsAt > now) {
      chrome.alarms.create('pro_trial_end', { when: endsAt });
    } else {
      // 已经过期，2秒后触发收尾
      chrome.alarms.create('pro_trial_end', { when: now + 2000 });
    }
  } catch (e) {
    console.warn('[AI-ThreadStash] scheduleTrialAlarms failed:', e);
  }
}

function notify(id, title, message, buttons = []) {
  try {
    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title,
      message,
      priority: 1,
      buttons
    });
  } catch (e) {
    console.warn('[AI-ThreadStash] notifications.create failed:', e);
  }
}

async function showTrialStartNotification() {
  notify(
    'pro_trial_start',
    'Pro 试用已激活',
    '已开启 7 天 Pro 版免费试用，尽情体验高级功能。',
    [
      { title: '了解权益' },
      { title: '升级到 Pro' }
    ]
  );
}

async function showTrialPreEndNotification(remainingMs) {
  const hours = Math.max(1, Math.round(remainingMs / 3600000));
  notify(
    'pro_trial_pre_end',
    'Pro 试用即将结束',
    `试用将在约 ${hours} 小时后结束，升级后可继续使用所有 Pro 功能。`,
    [
      { title: '查看权益' },
      { title: '立即升级' }
    ]
  );
}

async function showTrialEndedNotification() {
  notify(
    'pro_trial_end',
    'Pro 试用已结束',
    '试用期已结束，升级到 Pro 继续使用高级功能。',
    [
      { title: '了解价格' },
      { title: '立即升级' }
    ]
  );
}

// 处理通知点击（整卡点击）
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('pro_trial_')) {
    // 默认跳转到定价页
    chrome.tabs.create({ url: 'https://aithreadstash.com/pricing?from=trial_notif' });
  }
});

// 处理通知按钮点击
chrome.notifications.onButtonClicked?.addListener((notificationId, buttonIndex) => {
  if (!notificationId.startsWith('pro_trial_')) return;
  if (buttonIndex === 0) {
    // 了解权益
    chrome.tabs.create({ url: 'https://aithreadstash.com/pricing#benefits?from=trial_notif' });
  } else if (buttonIndex === 1) {
    // 立即升级
    chrome.tabs.create({ url: 'https://aithreadstash.com/pricing?from=trial_notif_btn' });
  }
});

// 服务启动/安装时，恢复闹钟
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getTrialState();
  scheduleTrialAlarms(state);
});
chrome.runtime.onStartup?.addListener(async () => {
  const state = await getTrialState();
  scheduleTrialAlarms(state);
});

// 处理闹钟事件
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pro_trial_pre_end') {
    const state = await getTrialState();
    const remain = computeRemainingMs(state);
    if (state?.active && remain > 0) {
      await showTrialPreEndNotification(remain);
    }
  }
  if (alarm.name === 'pro_trial_end') {
    const state = await getTrialState();
    const remain = computeRemainingMs(state);
    if (!state) return;

    // 标记试用结束
    const newState = {
      ...state,
      active: false,
      endedAt: Date.now(),
    };
    await setTrialState(newState);

    // 弹出结束提醒
    await showTrialEndedNotification();
  }
});
}

// 保留HTML格式，不进行转换
function stripHtmlTags(html) {
  if (!html || typeof html !== 'string') return html;
  
  // 直接返回原始HTML内容，不进行任何转换
  return html;
}

const PLATFORMS = {
  'claude': {
    script: 'content_scripts/claude.js',
    triggerAction: 'export-claude-content'
  },
  'deepseek': {
    script: 'content_scripts/deepseek.js',
    triggerAction: 'export-deepseek-content'
  },
  'gemini': {
    script: 'content_scripts/gemini.js',
    triggerAction: 'export-gemini-content'
  },
  'chatgpt': {
    script: 'content_scripts/chatgpt.js',
    triggerAction: 'export-chatgpt-content'
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action } = request;

  // 新增：设置下一次预览自动打印标志
  if (action === 'setAutoPrintNextPreview') {
    autoPrintNextPreview = !!request.value;
    sendResponse({ success: true, autoPrintNextPreview });
    return true;
  }

  /* Rollback: disable trial message handlers */ if (false) {
  // 新增：获取试用状态
  if (action === 'get-pro-trial-status') {
    (async () => {
      const state = await getTrialState();
      const remainingMs = computeRemainingMs(state);
      sendResponse({ success: true, state, remainingMs });
    })();
    return true; // async
  }

  // 新增：启动试用（无需信用卡）
  if (action === 'start-pro-trial') {
    (async () => {
      const existing = await getTrialState();
      const now = Date.now();

      // 如果已经激活且未到期，直接返回剩余
      if (existing?.active && computeRemainingMs(existing) > 0) {
        sendResponse({ success: true, alreadyActive: true, remainingMs: computeRemainingMs(existing) });
        return;
      }

      // 可根据需要限制“仅一次试用”，此处不做永久限制，允许重新开始（方便测试与用户体验）
      const newState = {
        active: true,
        startedAt: now,
        endsAt: now + TRIAL_DURATION_MS
      };
      await setTrialState(newState);

      // 安排提醒并通知开始
      scheduleTrialAlarms(newState);
      await showTrialStartNotification();

      sendResponse({ success: true, started: true, remainingMs: TRIAL_DURATION_MS });
    })();
    return true; // async
  }
  }

  // Handle export triggers from popup
  const exportPlatformName = action && action.startsWith('export-') ? action.substring('export-'.length) : null;
  if (exportPlatformName && PLATFORMS[exportPlatformName]) {
    console.log(`[AI-ThreadStash] Received export request for ${exportPlatformName}`);
    const platform = PLATFORMS[exportPlatformName];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        console.log(`[AI-ThreadStash] Preparing to inject ${exportPlatformName} content script into tab ${activeTab.id}`);
        
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: [platform.script]
        }, () => {
          if (chrome.runtime.lastError) {
            console.error(`[AI-ThreadStash] Error injecting ${exportPlatformName} script:`, chrome.runtime.lastError.message);
            sendResponse({ success: false, message: `Injection failed: ${chrome.runtime.lastError.message}` });
            return;
          }
          console.log(`[AI-ThreadStash] ${exportPlatformName} content script injected. Waiting for initialization...`);
          
          // 添加延迟确保content script完全初始化
          setTimeout(() => {
            console.log(`[AI-ThreadStash] Triggering ${exportPlatformName} export...`);
            // 直接调用内容脚本并等待响应
            chrome.tabs.sendMessage(activeTab.id, { action: platform.triggerAction }, (response) => {
              if (chrome.runtime.lastError) {
                console.error(`[AI-ThreadStash] Error triggering ${exportPlatformName} export:`, chrome.runtime.lastError.message);
                sendResponse({ success: false, message: chrome.runtime.lastError.message });
              } else {
                console.log(`[AI-ThreadStash] ${exportPlatformName} export triggered, response:`, response);
                // 内容脚本现在会直接发送content-ready或content-failed消息
                sendResponse({ success: true, message: 'Export triggered successfully' });
              }
            });
          }, 500); // 500ms延迟确保content script初始化完成
        });
      } else {
        console.error(`[AI-ThreadStash] No active tab found for ${exportPlatformName}`);
        sendResponse({ success: false, message: 'No active tab found' });
      }
    });
    return true; // async response
  }

  // Generic content-ready handler
  if (action && action.endsWith('-content-ready')) {
    const platformName = action.split('-')[0];
    console.log(`[AI-ThreadStash] Received ${platformName} content from content script`, action, request.data);
    try {
      // Convert data format if needed (for Gemini compatibility)
      let data = request.data;
      if (data.messages && !data.turns) {
        console.log(`[AI-ThreadStash] Converting Gemini data format from messages to turns`);
        console.log(`[AI-ThreadStash] Original messages:`, data.messages);
        
        // Convert { title, messages } format to { title, turns } format
        data = {
          title: data.title,
          url: data.url || '',
          exportedAt: data.exportedAt || new Date().toISOString(),
          turns: data.messages.map(msg => ({
            role: msg.author === 'User' ? 'user' : 'assistant',
            content: {
              text: typeof msg.content === 'string' ? stripHtmlTags(msg.content) : stripHtmlTags(String(msg.content)),
              html: msg.content // Keep original HTML for formatting
            }
          }))
        };
        console.log(`[AI-ThreadStash] Converted data:`, data);
        
        // 调试：检查第一个转换后的消息
        if (data.turns && data.turns.length > 0) {
          console.log(`[AI-ThreadStash] First converted turn:`, data.turns[0]);
          console.log(`[AI-ThreadStash] First turn html length:`, data.turns[0].content.html ? data.turns[0].content.html.length : 'null');
          console.log(`[AI-ThreadStash] First turn text length:`, data.turns[0].content.text ? data.turns[0].content.text.length : 'null');
        }
      }
      openPreviewPage(data);
    } catch (e) {
      console.error(`[AI-ThreadStash] Error opening preview page (${platformName}):`, e);
    }
    // 关键修复：向内容脚本返回一个确认响应，避免“message port closed”错误
    try { sendResponse({ success: true, received: true }); } catch (e) { /* ignore */ }
    return; 
  }

  // Generic content-failed handler
  if (action && action.endsWith('-content-failed')) {
    const platformName = action.split('-')[0];
    console.error(`[AI-ThreadStash] ${platformName} content extraction failed:`, request.error);
    // Open preview page with error message
    openPreviewPage({
        title: `导出失败 - ${platformName.charAt(0).toUpperCase() + platformName.slice(1)}`,
        url: '',
        exportedAt: new Date().toISOString(),
        turns: [{ role: 'system', content: { text: `从 ${platformName} 导出内容失败。\n\n错误信息: ${request.error}` } }]
    });
    // 关键修复：返回确认响应给内容脚本，避免端口关闭报错
    try { sendResponse({ success: true, received: true }); } catch (e) { /* ignore */ }
    return;
  }

  // Keep existing preview data fetch
  if (action === 'get-preview-data') {
    console.log('[AI-ThreadStash] Received request for preview data');
    if (latestChatData) {
      sendResponse({ success: true, data: latestChatData });
    } else {
      sendResponse({ success: false, error: 'No data available' });
    }
    return true;
  }

  // Get conversation data by key
  if (action === 'getConversationData') {
    const key = request.key;
    console.log(`[AI-ThreadStash] Received request for conversation data with key: ${key}`);
    
    if (conversationStore.has(key)) {
      const data = conversationStore.get(key);
      sendResponse({ success: true, data });
    } else {
      sendResponse({ success: false, error: 'Conversation data not found' });
    }
    return true;
  }

  // Handle test connection from preview page
  if (action === 'test-connection') {
    console.log(`[AI-ThreadStash] Test connection from tab:`, sender.tab?.id);
    sendResponse({ success: true, message: 'Background connection test successful' });
    return true;
  }

  // Handle preview page ready signal
  if (action === 'preview-page-ready') {
    console.log(`[AI-ThreadStash] Preview page is ready, sender tab:`, sender.tab?.id);
    
    // 检查是否有匹配的预览页面等待数据
    const tabId = sender.tab?.id;
    if (tabId && latestChatData) {
      console.log('[AI-ThreadStash] Sending data to ready preview page...');
      chrome.tabs.sendMessage(tabId, {
        action: 'preview-data',
        data: latestChatData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[AI-ThreadStash] Failed to send data to ready preview page:', chrome.runtime.lastError.message);
        } else {
          console.log('[AI-ThreadStash] Data sent to preview page successfully:', response);
        }
      });
    }
    
    sendResponse({ success: true, message: 'Background received ready signal' });
    return true;
  }

  // Handle keep-alive messages from preview page
  if (action === 'keep-alive') {
    console.log('[AI-ThreadStash] Received keep-alive message from preview page');
    sendResponse({ success: true, message: 'Background is alive' });
    return true;
  }
});

function openPreviewPage(data) {
  console.log('[AI-ThreadStash] Storing chat data and opening preview page.', data);
  latestChatData = data;
  
  // Store conversation data with a unique key
  const conversationKey = `conv_${Date.now()}_${conversationCounter++}`;
  conversationStore.set(conversationKey, data);
  
  // Clean up old conversations (keep only last 10)
  if (conversationStore.size > 10) {
    const keys = Array.from(conversationStore.keys());
    for (let i = 0; i < keys.length - 10; i++) {
      conversationStore.delete(keys[i]);
    }
  }
  
  // 新增：根据标志拼接自动打印参数
  const autoParam = autoPrintNextPreview ? '&autoPrint=1' : '';
  // 使用后重置标志，保证只生效一次
  if (autoPrintNextPreview) autoPrintNextPreview = false;
  const previewUrl = chrome.runtime.getURL(`preview/preview.html?key=${conversationKey}${autoParam}`);
  
  // 在当前窗口的新标签页中打开预览页面
  chrome.tabs.create({
    url: previewUrl,
    active: true
  }, (newTab) => {
    if (chrome.runtime.lastError) {
      console.error('[AI-ThreadStash] Error creating preview tab:', chrome.runtime.lastError);
      return;
    }
    
    console.log(`[AI-ThreadStash] Created new preview tab with id ${newTab.id}`);
    console.log(`[AI-ThreadStash] Preview tab created, waiting for ready signal from tab ${newTab.id}`);
  });
}