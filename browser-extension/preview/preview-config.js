// 配置 Prism.js
window.Prism = window.Prism || {};
// 禁用工具栏插件
Prism.plugins = { toolbar: { registerButton: function(){} } };
// 配置自动加载器
Prism.plugins.autoloader = Prism.plugins.autoloader || {};
Prism.plugins.autoloader.languages_path = (chrome && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL('preview/libs/prism/') + 'prism-{id}.min.js' : 'libs/prism/prism-{id}.min.js';