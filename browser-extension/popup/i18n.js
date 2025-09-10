// 简单的国际化实现（根据浏览器语言自动选择，未匹配则回退到英文）
const i18n = {
    translations: {
        en: {
            exportChatGPT: 'Export ChatGPT Conversation',
            exportDeepSeek: 'Export DeepSeek Conversation',
            exportGemini: 'Export Gemini Conversation',
            help: 'Help',
            detectingPlatform: 'Detecting platform...',
            selectExportChatGPT: 'Select to export ChatGPT conversation',
            selectExportDeepSeek: 'Select to export DeepSeek conversation',
            selectExportGemini: 'Select to export Gemini conversation',
            unsupportedPlatform: 'Unsupported platform',
            openSupportedPlatform: 'Please open a supported conversation platform',
            unknownPage: 'Unknown page',
            cannotGetPageInfo: 'Cannot get page info',
            parsingConversation: 'Parsing {platform} conversation...',
            injectingScript: 'Injecting script...',
            injectionFailed: 'Script injection failed',
            requestTimeout: 'Request timeout',
            parsingFailed: 'Parsing failed',
            exportSuccess: 'Export successful!',
            exportFailed: 'Export failed'
        },
        zh_CN: {
            exportChatGPT: '导出 ChatGPT 对话',
            exportDeepSeek: '导出 DeepSeek 对话',
            exportGemini: '导出 Gemini 对话',
            help: '帮助',
            detectingPlatform: '检测平台中...',
            selectExportChatGPT: '选择导出 ChatGPT 对话',
            selectExportDeepSeek: '选择导出 DeepSeek 对话',
            selectExportGemini: '选择导出 Gemini 对话',
            unsupportedPlatform: '不支持的平台',
            openSupportedPlatform: '请打开支持的对话平台',
            unknownPage: '未知页面',
            cannotGetPageInfo: '无法获取页面信息',
            parsingConversation: '正在解析 {platform} 对话...',
            injectingScript: '正在注入脚本...',
            injectionFailed: '脚本注入失败',
            requestTimeout: '请求超时',
            parsingFailed: '解析失败',
            exportSuccess: '导出成功！',
            exportFailed: '导出失败'
        }
    },

    currentLang: null,

    resolveLanguage: function () {
        const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(l => (l || '').toLowerCase());
        for (const lang of langs) {
            if (lang.startsWith('zh')) return 'zh_CN';
            if (lang.startsWith('en')) return 'en';
        }
        return 'en';
    },

    getCurrentLanguage: function () {
        if (!this.currentLang) {
            this.currentLang = this.resolveLanguage();
        }
        return this.currentLang;
    },

    t: function (key, params = {}) {
        const lang = this.getCurrentLanguage();
        let translation = (this.translations[lang] && this.translations[lang][key])
            || (this.translations.en && this.translations.en[key])
            || key;
        for (const [param, value] of Object.entries(params)) {
            translation = translation.replace(`{${param}}`, value);
        }
        return translation;
    }
};

// 全局可用
i18n.getCurrentLanguage = i18n.getCurrentLanguage.bind(i18n);
i18n.t = i18n.t.bind(i18n);