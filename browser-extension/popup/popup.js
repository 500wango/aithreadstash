// Use the global i18n instance from i18n.js
// No need to create a new instance as it's already created in i18n.js

document.addEventListener('DOMContentLoaded', function() {
    
    const exportChatGPT = document.getElementById('exportChatGPT');
    const exportDeepSeek = document.getElementById('exportDeepSeek');
    const status = document.getElementById('status');
    const platformName = document.getElementById('platformName');
    const platformInfo = document.getElementById('platformInfo');
    const helpLink = document.getElementById('helpLink');
    
    // Initialize UI text with i18n
    exportChatGPT.textContent = i18n.t('exportChatGPT');
    exportDeepSeek.textContent = i18n.t('exportDeepSeek');
    helpLink.textContent = i18n.t('help');
    platformName.textContent = i18n.t('detectingPlatform');
    
    // 帮助链接点击事件
    helpLink.addEventListener('click', function(e) {
        e.preventDefault();
        // 获取当前语言设置并传递给help页面
        const currentLang = i18n.getCurrentLanguage();
        const helpUrl = chrome.runtime.getURL('help.html') + '?lang=' + currentLang;
        chrome.tabs.create({
            url: helpUrl
        });
    });
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        if (currentTab && currentTab.url) {
            let platform = '';
            let platformIcon = '🤖';
            
            if (currentTab.url.includes('chat.openai.com') || currentTab.url.includes('chatgpt.com')) {
                platform = 'ChatGPT';
                platformIcon = '🤖';
                exportChatGPT.disabled = false;
                exportDeepSeek.disabled = true;
                status.textContent = i18n.t('selectExportChatGPT');
            } else if (currentTab.url.includes('chat.deepseek.com')) {
                platform = 'DeepSeek';
                platformIcon = '🧠';
                exportChatGPT.disabled = true;
                exportDeepSeek.disabled = false;
                status.textContent = i18n.t('selectExportDeepSeek');
            } else {
                platform = i18n.t('unsupportedPlatform');
                platformIcon = '❌';
                exportChatGPT.disabled = true;
                exportDeepSeek.disabled = true;
                status.textContent = i18n.t('openSupportedPlatform');
            }
            
            platformName.textContent = platform;
            platformInfo.querySelector('.platform-icon').textContent = platformIcon;
        } else {
            platformName.textContent = i18n.t('unknownPage');
            platformInfo.querySelector('.platform-icon').textContent = '❓';
            exportChatGPT.disabled = true;
            exportDeepSeek.disabled = true;
            status.textContent = i18n.t('cannotGetPageInfo');
        }
    });
    
    // ChatGPT 导出按钮点击事件
    exportChatGPT.addEventListener('click', function() {
        if (exportChatGPT.disabled) return;
        handleExport('chatgpt');
    });
    
    // DeepSeek 导出按钮点击事件
    exportDeepSeek.addEventListener('click', function() {
        if (exportDeepSeek.disabled) return;
        handleExport('deepseek');
    });
    
    function handleExport(platform) {
        const exportBtn = platform === 'chatgpt' ? exportChatGPT : exportDeepSeek;
        exportBtn.disabled = true;
        status.textContent = i18n.t('parsingConversation', {platform: platform.toUpperCase()});
        status.className = 'status-message loading';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            // 根据平台选择正确的脚本文件
            const scriptFile = platform === 'deepseek' ? 
                'content-scripts/deepseek-clean.js' : 'content-scripts/chatgpt.js';
            
            // 首先检查内容脚本是否已注入
            chrome.tabs.sendMessage(tab.id, {action: 'ping'}, function(response) {
                if (chrome.runtime.lastError || !response) {
                    // 内容脚本未注入，尝试重新注入
                    status.textContent = i18n.t('injectingScript');
                    
                    chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        files: [scriptFile]
                    }).then(() => {
                        // 脚本注入成功，发送导出消息
                        sendExportMessage(tab.id, platform);
                    }).catch(error => {
                        status.textContent = i18n.t('injectionFailed') + ': ' + error.message;
                        status.className = 'status-message error';
                        exportBtn.disabled = false;
                    });
                } else {
                    // 内容脚本已就绪，直接发送导出消息
                    sendExportMessage(tab.id, platform);
                }
            });
        });
    }
    
    function sendExportMessage(tabId, platform) {
        const exportBtn = platform === 'chatgpt' ? exportChatGPT : exportDeepSeek;
        
        // 设置超时防止挂起
        const timeout = setTimeout(() => {
            status.textContent = i18n.t('requestTimeout');
            status.className = 'status-message error';
            exportBtn.disabled = false;
        }, 10000);
        
        chrome.tabs.sendMessage(tabId, {action: 'export'}, function(response) {
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
                
                // 打开预览页面
                chrome.tabs.create({
                    url: chrome.runtime.getURL(`preview/preview.html?key=${response.key}`)
                });
                
                // 关闭弹窗
                setTimeout(() => window.close(), 1000);
            } else {
                const errorMsg = response ? response.error : '未知错误';
                // Export failed
                status.textContent = i18n.t('exportFailed') + ': ' + errorMsg;
                status.className = 'status-message error';
                exportBtn.disabled = false;
            }
        });
    }
});