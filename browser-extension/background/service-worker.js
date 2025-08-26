// AI ThreadStash background service worker loaded

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 确保消息来自我们的扩展
    if (!sender.id || sender.id !== chrome.runtime.id) {
        // Received message from unknown source
        sendResponse({ error: 'Invalid message source' });
        return;
    }
    // 验证消息格式
    if (!request || !request.action) {
        // Invalid message format
        sendResponse({ error: 'Invalid message format' });
        return;
    }

    // 处理预览请求
    if (request.action === 'openPreview') {
        // 验证数据
        if (!request.data || typeof request.data !== 'object' || !request.data.turns || !Array.isArray(request.data.turns)) {
            // Invalid conversation data object
            sendResponse({ error: 'Invalid conversation data format' });
            return;
        }
        openPreviewPage(request.data);
        sendResponse({success: true});
        return true;
    }
    
    // 处理存储对话数据请求
    if (request.action === 'storeConversationData') {
        if (!request.data || typeof request.data !== 'object') {
            sendResponse({success: false, error: '无效的对话数据'});
            return true;
        }
        
        try {
            const key = 'deepseek_' + Date.now();
            const conversationData = {
                ...request.data,
                url: request.url || '',
                exportedAt: new Date().toISOString()
            };
            
            chrome.storage.session.set({[key]: conversationData})
                .then(() => {
                    // Data saved successfully
                    sendResponse({success: true, key: key});
                })
                .catch(error => {
                    // Storage error
                    sendResponse({success: false, error: '存储失败: ' + error.message});
                });
            return true;
        } catch (error) {
            // Store data error
            sendResponse({success: false, error: '存储过程中发生错误: ' + error.message});
            return true;
        }
    }
    
    if (request.action === 'getConversationData') {
        if (!request.key) {
            sendResponse({success: false, error: '未提供数据密钥'});
            return true;
        }
        try {
            chrome.storage.session.get(request.key)
                .then(data => {
                    if (!data) {
                        throw new Error('存储访问失败');
                    }
                    if (!data[request.key]) {
                        throw new Error('未找到对话数据');
                    }
                    const conversationData = data[request.key];
                    if (!conversationData.turns || !Array.isArray(conversationData.turns)) {
                        throw new Error('对话数据格式错误');
                    }
                    if (conversationData.turns.length === 0) {
                        throw new Error('对话内容为空');
                    }
                    sendResponse({success: true, data: conversationData});
                })
                .catch(error => {
                    // Storage error
                    sendResponse({success: false, error: error.message});
                });
            return true;
        } catch (error) {
            // Message handling error
            sendResponse({success: false, error: error.message || '处理请求失败'});
            return true;
        }
    }
});

async function openPreviewPage(conversationData) {
    // 清理旧数据
    try {
        await chrome.storage.session.clear();
        // Cleared old conversation data
    } catch (error) {
        // Failed to clear old data
    }
    const previewUrl = chrome.runtime.getURL('preview/preview.html');
    
    const dataKey = `conversation_${Date.now()}`;
    const data = {};
    data[dataKey] = conversationData;
    
    // 先尝试存储数据
    chrome.storage.session.set(data)
        .then(() => {
            // 验证数据是否成功存储
            return chrome.storage.session.get(dataKey);
        })
        .then(result => {
            if (result && result[dataKey]) {
                // 数据存储成功，打开预览页面
                return chrome.tabs.create({
                    url: `${previewUrl}?key=${dataKey}`,
                    active: true
                });
            } else {
                throw new Error('Data verification failed');
            }
        })
        .catch(error => {
            // Failed to handle conversation data
            // 如果是存储错误，尝试清理旧数据
            if (error.message.includes('storage')) {
                chrome.storage.session.clear().then(() => {
                    // Cleared session storage, retrying
                    openPreviewPage(conversationData);
                }).catch(clearError => {
                    // Failed to clear storage
                });
            }
        });
}