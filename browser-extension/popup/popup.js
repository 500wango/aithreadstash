// Use the global i18n instance from i18n.js
// No need to create a new instance as it's already created in i18n.js

document.addEventListener('DOMContentLoaded', function() {
    const isExtensionEnv = typeof chrome !== 'undefined' && !!(chrome?.tabs) && !!(chrome?.runtime);

    const exportChatGPT = document.getElementById('exportChatGPT');
    const exportDeepSeek = document.getElementById('exportDeepSeek');
    const exportClaude = document.getElementById('exportClaude');
    const exportGemini = document.getElementById('exportGemini');
    const printPDF = document.getElementById('printPDF');
    const status = document.getElementById('status');
    const platformName = document.getElementById('platformName');
    const platformInfo = document.getElementById('platformInfo');
    const helpLink = document.getElementById('helpLink');
    const manageAccount = document.getElementById('manageAccount');
    const upgradePro = document.getElementById('upgradePro');
    const manageIntegrations = document.getElementById('manageIntegrations');
    // removed: startTrial & trialStatus
    
    // Initialize UI text with i18n
    exportChatGPT.textContent = i18n.t('exportChatGPT');
    exportDeepSeek.textContent = i18n.t('exportDeepSeek');
    exportClaude.textContent = i18n.t('exportClaude');
    exportGemini.textContent = i18n.t('exportGemini');
    helpLink.textContent = i18n.t('help');
    platformName.textContent = i18n.t('detectingPlatform');
    if (printPDF) { printPDF.querySelector('.button-text')?.setAttribute('data-i18n', 'print'); }
    if (manageAccount) { manageAccount.querySelector('.button-text')?.setAttribute('data-i18n', 'manageAccount'); }
    if (upgradePro) { upgradePro.querySelector('.button-text')?.setAttribute('data-i18n', 'upgradePro'); }
    if (manageIntegrations) { manageIntegrations.querySelector('.button-text')?.setAttribute('data-i18n', 'manageIntegrations'); }
    // removed: startTrial i18n binding

    // removed: formatRemaining/renderTrialStatus/refreshTrialStatus/startTrial handler

    // 帮助链接点击事件（适配非扩展预览环境）
    helpLink.addEventListener('click', function(e) {
        e.preventDefault();
        const currentLang = i18n.getCurrentLanguage();
        const helpUrl = (isExtensionEnv ? chrome.runtime.getURL('help.html') : 'help.html') + '?lang=' + currentLang;
        if (isExtensionEnv) {
            chrome.tabs.create({ url: helpUrl });
        } else {
            window.open(helpUrl, '_blank');
        }
    });

    // 账户/升级/集成入口：打开站点对应页面（预览与扩展均可）
    function openSitePath(path) {
        try {
            const base = 'https://aithreadstash.com';
            const url = base + path;
            if (isExtensionEnv) {
                chrome.tabs.create({ url });
            } else {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.warn('[AI-ThreadStash] openSitePath failed:', e);
        }
    }
    manageAccount?.addEventListener('click', () => openSitePath('/account'));
    upgradePro?.addEventListener('click', () => openSitePath('/pricing?from=ext'));
    manageIntegrations?.addEventListener('click', () => openSitePath('/integrations?from=ext'));

    // 侦测平台并控制按钮状态（兼容预览环境）
    if (!isExtensionEnv) {
        platformName.textContent = '预览模式';
        platformInfo.querySelector('.platform-icon').textContent = '👀';
        exportChatGPT.disabled = true;
        exportDeepSeek.disabled = true;
        exportClaude.disabled = true;
        exportGemini.disabled = true;
        status.textContent = '预览模式：无法获取页面信息';
        status.className = 'status-message';
        if (printPDF) printPDF.disabled = true;
    } else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            
            if (currentTab && currentTab.url) {
                let platform = '';
                let platformIcon = '🤖';
                let isChatGPT = false, isDeepSeek = false;
                
                if (currentTab.url.includes('chat.openai.com') || currentTab.url.includes('chatgpt.com')) {
                    platform = 'ChatGPT';
                    platformIcon = '🤖';
                    isChatGPT = true;
                    exportChatGPT.disabled = false;
                    exportDeepSeek.disabled = true;
                    exportClaude.disabled = true;
                    exportGemini.disabled = true;
                    status.textContent = i18n.t('selectExportChatGPT');
                } else if (currentTab.url.includes('chat.deepseek.com')) {
                    platform = 'DeepSeek';
                    platformIcon = '🧠';
                    isDeepSeek = true;
                    exportChatGPT.disabled = true;
                    exportDeepSeek.disabled = false;
                    exportClaude.disabled = true;
                    exportGemini.disabled = true;
                    status.textContent = i18n.t('selectExportDeepSeek');
                } else if (currentTab.url.includes('claude.ai')) {
                    platform = 'Claude';
                    platformIcon = '🎭';
                    exportChatGPT.disabled = true;
                    exportDeepSeek.disabled = true;
                    exportClaude.disabled = false;
                    exportGemini.disabled = true;
                    status.textContent = i18n.t('selectExportClaude');
                } else if (currentTab.url.includes('gemini.google.com')) {
                    platform = 'Gemini';
                    platformIcon = '✨';
                    exportChatGPT.disabled = true;
                    exportDeepSeek.disabled = true;
                    exportClaude.disabled = true;
                    exportGemini.disabled = false;
                    status.textContent = i18n.t('selectExportGemini');
                } else {
                    platform = i18n.t('unsupportedPlatform');
                    platformIcon = '❌';
                    exportChatGPT.disabled = true;
                    exportDeepSeek.disabled = true;
                    exportClaude.disabled = true;
                    exportGemini.disabled = true;
                    status.textContent = i18n.t('openSupportedPlatform');
                }
                platformName.textContent = platform;
                platformInfo.querySelector('.platform-icon').textContent = platformIcon;

                // 设置“打印为PDF”按钮状态，只在ChatGPT/DeepSeek可用
                if (printPDF) {
                    const enabled = isChatGPT || isDeepSeek;
                    printPDF.disabled = !enabled;
                    printPDF.title = enabled ? '' : '仅支持 ChatGPT/DeepSeek';
                }
            } else {
                platformName.textContent = i18n.t('unknownPage');
                platformInfo.querySelector('.platform-icon').textContent = '❓';
                exportChatGPT.disabled = true;
                exportDeepSeek.disabled = true;
                exportClaude.disabled = true;
                exportGemini.disabled = true;
                status.textContent = i18n.t('cannotGetPageInfo');
                if (printPDF) printPDF.disabled = true;
            }
        });
    }

    // 原导出事件保留
    exportChatGPT.addEventListener('click', function() { if (!exportChatGPT.disabled) handleExport('chatgpt'); });
    exportDeepSeek.addEventListener('click', function() { if (!exportDeepSeek.disabled) handleExport('deepseek'); });
    exportClaude.addEventListener('click', function() { if (!exportClaude.disabled) handleExport('claude'); });
    exportGemini.addEventListener('click', function() { if (!exportGemini.disabled) handleExport('gemini'); });

    // “打印为PDF”流程（非扩展预览直接提示不可用）
    printPDF?.addEventListener('click', async function() {
        if (!isExtensionEnv) {
            status.textContent = '预览模式不支持打印流程，请在已安装的扩展中使用';
            status.className = 'status-message error';
            return;
        }
        // 仅针对免费平台：ChatGPT / DeepSeek
        status.textContent = i18n.t('parsingConversation', {platform: 'PDF'});
        status.className = 'status-message loading';
        try {
            // 设置下一次预览为自动打印
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'setAutoPrintNextPreview', value: true }, (resp) => {
                    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                    if (!resp || resp.success !== true) return reject(new Error('Failed to set auto print'));
                    resolve();
                });
            });
            // 触发对应平台导出
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                const tab = tabs[0];
                const url = tab?.url || '';
                const isChatGPT = url.includes('chat.openai.com') || url.includes('chatgpt.com');
                const isDeepSeek = url.includes('chat.deepseek.com');
                if (isChatGPT) {
                    sendExportMessage(tab.id, 'chatgpt');
                } else if (isDeepSeek) {
                    sendExportMessage(tab.id, 'deepseek');
                } else {
                    status.textContent = '仅支持 ChatGPT/DeepSeek 打印';
                    status.className = 'status-message error';
                }
            });
        } catch (e) {
            status.textContent = '打印流程启动失败: ' + e.message;
            status.className = 'status-message error';
        }
    });

    function handleExport(platform) {
        const exportBtn = platform === 'chatgpt' ? exportChatGPT : 
                         platform === 'deepseek' ? exportDeepSeek : 
                         platform === 'claude' ? exportClaude : exportGemini;

        // 预览环境防护
        if (!isExtensionEnv) {
            status.textContent = '预览模式不支持导出，请在已安装的扩展中使用';
            status.className = 'status-message error';
            return;
        }
        exportBtn.disabled = true;
        status.textContent = i18n.t('parsingConversation', {platform: platform.toUpperCase()});
        status.className = 'status-message loading';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            // 根据平台选择正确的脚本文件
            const scriptFile = platform === 'deepseek' ? 
                'content_scripts/deepseek.js' : 
                platform === 'gemini' ? 'content_scripts/gemini.js' : 
                platform === 'claude' ? 'content_scripts/claude.js' : 'content_scripts/chatgpt.js';
            
            // 首先检查内容脚本是否已注入
            console.log(`[AI-ThreadStash] Checking if ${platform} content script is injected`);
            chrome.tabs.sendMessage(tab.id, {action: 'ping'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log(`[AI-ThreadStash] Ping failed: ${chrome.runtime.lastError.message}`);
                }
                
                if (chrome.runtime.lastError || !response) {
                    // 内容脚本未注入，尝试重新注入
                    console.log(`[AI-ThreadStash] ${platform} content script not injected, injecting now`);
                    status.textContent = i18n.t('injectingScript');
                    
                    chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        files: [scriptFile]
                    }).then(() => {
                        console.log(`[AI-ThreadStash] ${platform} content script injected successfully`);
                        // 脚本注入成功，发送导出消息
                        sendExportMessage(tab.id, platform);
                    }).catch(error => {
                        console.error(`[AI-ThreadStash] ${platform} script injection failed:`, error);
                        status.textContent = i18n.t('injectionFailed') + ': ' + error.message;
                        status.className = 'status-message error';
                        exportBtn.disabled = false;
                    });
                } else {
                    // 内容脚本已就绪，直接发送导出消息
                    console.log(`[AI-ThreadStash] ${platform} content script already injected`);
                    sendExportMessage(tab.id, platform);
                }
            });
        });
    }
    
    function sendExportMessage(tabId, platform) {
        const exportBtn = platform === 'chatgpt' ? exportChatGPT : 
                         platform === 'deepseek' ? exportDeepSeek : 
                         platform === 'claude' ? exportClaude : exportGemini;
        
        console.log(`[AI-ThreadStash] Sending export message to ${platform} content script`);
        
        // 设置超时防止挂起
        const timeout = setTimeout(() => {
            console.log(`[AI-ThreadStash] Export request timeout for ${platform}`);
            status.textContent = i18n.t('requestTimeout');
            status.className = 'status-message error';
            exportBtn.disabled = false;
        }, 10000);
        
        // 根据平台发送正确的消息
        const actionMessage = platform === 'chatgpt' ? 'export-chatgpt' :
                             platform === 'deepseek' ? 'export-deepseek-content' :
                             platform === 'claude' ? 'export-claude-content' :
                             platform === 'gemini' ? 'export-gemini-content' : 'export';
        
        chrome.tabs.sendMessage(tabId, {action: actionMessage}, function(response) {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                // Chrome runtime error
                status.textContent = i18n.t('parsingFailed') + ': ' + errorMsg;
                status.className = 'status-message error';
                exportBtn.disabled = false;
                return;
            }
            
            // Export response received
            
            if (response && response.success) {
                status.textContent = i18n.t('exportSuccess');
                status.className = 'status-message success';
                console.log('[AI-ThreadStash] Export successful, preview will be opened by background script');
                
                // 关闭弹窗
                setTimeout(() => window.close(), 1000);
            } else {
                // Export failed - handle various error response formats
                let errorMsg = '未知错误';
                
                if (response) {
                    if (response.error) {
                        errorMsg = response.error;
                    } else if (response.message) {
                        errorMsg = response.message;
                    } else if (response.success === false) {
                        errorMsg = '导出操作失败';
                    } else {
                        errorMsg = '响应格式错误: ' + JSON.stringify(response);
                    }
                } else {
                    errorMsg = '无响应数据';
                }
                
                console.error(`[AI-ThreadStash] Export failed for ${platform}:`, JSON.stringify(response, null, 2));
                status.textContent = i18n.t('exportFailed') + ': ' + errorMsg;
                status.className = 'status-message error';
                exportBtn.disabled = false;
            }
        });
    }
});