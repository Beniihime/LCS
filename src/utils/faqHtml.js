const COLOR_CLASS_PREFIX = 'ql-color-';

function stripColorStyles(styleValue = '') {
    return String(styleValue)
        .split(';')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .filter((declaration) => {
            const property = declaration.split(':')[0]?.trim().toLowerCase();
            return property !== 'color' && property !== '-webkit-text-fill-color';
        })
        .join('; ');
}

export function sanitizeFaqTextHtml(html = '') {
    if (typeof document === 'undefined') return String(html || '');

    const root = document.createElement('div');
    root.innerHTML = String(html || '');

    root.querySelectorAll('*').forEach((element) => {
        element.removeAttribute('color');

        const styleValue = element.getAttribute('style');
        if (styleValue) {
            const cleanedStyle = stripColorStyles(styleValue);
            if (cleanedStyle) {
                element.setAttribute('style', cleanedStyle);
            } else {
                element.removeAttribute('style');
            }
        }

        const className = element.getAttribute('class');
        if (className) {
            const filteredClasses = className
                .split(/\s+/)
                .filter(Boolean)
                .filter((cls) => !cls.startsWith(COLOR_CLASS_PREFIX));

            if (filteredClasses.length > 0) {
                element.setAttribute('class', filteredClasses.join(' '));
            } else {
                element.removeAttribute('class');
            }
        }
    });

    return root.innerHTML;
}

export function attachPlainTextPasteToQuill(quillInstance) {
    const quill = quillInstance?.instance || quillInstance;
    if (!quill?.root || typeof quill.insertText !== 'function') {
        return () => {};
    }

    const onPaste = (event) => {
        const plainText = event.clipboardData?.getData('text/plain');
        if (!plainText) return;

        event.preventDefault();
        const selection = quill.getSelection(true);
        const index = selection?.index ?? quill.getLength();
        const length = selection?.length ?? 0;

        if (length > 0) {
            quill.deleteText(index, length, 'user');
        }

        quill.insertText(index, plainText, 'user');
        quill.setSelection(index + plainText.length, 0, 'silent');
    };

    quill.root.addEventListener('paste', onPaste);
    return () => quill.root.removeEventListener('paste', onPaste);
}
