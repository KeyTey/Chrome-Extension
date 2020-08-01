// キーイベント on 言語選択
$('.tl-wrap').on('keydown', (e) => {
    const activeElement = document.activeElement;
    // 左キーでフォーカスの逆移動
    if (e.keyCode === 37 && activeElement.previousSibling) {
        activeElement.previousSibling.focus();
        return true;
    }
    // 右キーでフォーカスの移動
    if (e.keyCode === 39 && activeElement.nextSibling) {
        activeElement.nextSibling.focus();
        return true;
    }
    return true;
});

// キーイベント on 全体
$('body').on('keydown', (e) => {
    // Escキーでフォーカス解除
    if (e.keyCode === 27) {
        $(':focus').blur();
        return true;
    }
    // フォーカスされている場合
    if ($(':focus').length > 0) {
        return true;
    }
    const container = $('.sl-sugg-button-container')[1];
    const btnList = $(container).children();
    // 左キーで言語選択(左)へフォーカス
    if (e.keyCode === 37) {
        $(btnList)[0].focus();
        return true;
    }
    // 右キーで言語選択(右)へフォーカス
    if (e.keyCode === 39) {
        $(btnList)[1].focus();
        return true;
    }
    // Enterキーでテキストエリアへフォーカス
    if (e.keyCode === 13) {
        const source = $('#source');
        // Shift + Enter でテキスト整形
        if (e.shiftKey) {
            const text = $(source).val();
            const sentences = formatText(text);
            $(source).val(sentences.join('\n\n'));
        }
        $(source).focus();
        return false;
    }
    return true;
});
