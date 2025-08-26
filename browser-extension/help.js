document.addEventListener('DOMContentLoaded', function() {
    if (typeof I18n !== 'undefined') {
        // Get language from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        let finalLang;
        if (urlLang && (urlLang === 'en' || urlLang === 'zh')) {
            finalLang = urlLang;
        } else {
            finalLang = 'en';
        }
        
        // Create i18n instance with correct language
        const i18n = new I18n();
        i18n.setLanguage(finalLang);
        window.i18n = i18n;
        
        // Update page content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = i18n.t(key);
            if (element.tagName === 'TITLE') {
                element.textContent = translation;
            } else {
                element.innerHTML = translation;
            }
        });
    }
});