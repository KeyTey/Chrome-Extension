// 状態
const state = {
    enableTakeOver: false,
    text: '',
    mouseDownTime: 0
};

// 英語から日本語へ翻訳する
const getTranslatedData = (sentence) => {
    const data = {
        text: sentence,
        source: 'en',
        target: 'ja'
    };
    const request = {
        url: GOOGLE_TRANSLATE_API_URL,
        dataType: 'json',
        type: 'GET',
        data: data
    };
    return $.ajax(request);
};

// 翻訳結果をスレッドへ表示する
const addResult = (source, target) => {
    // 翻訳アイテム
    const translateItem = $('<li>', { class: 'translate-item' });
    $('<p>', { class: 'sentence', text: source }).appendTo(translateItem);
    $('<p>', { class: 'sentence', text: target }).appendTo(translateItem);
    // DeepL翻訳リンク
    const footer = $('<div>', { class: 'sentence text-right' });
    const url = `https://www.deepl.com/translator#en/ja/${source}`;
    $('<a>', { href: url, target: '_blank', text: 'DeepL' }).appendTo(footer);
    $(footer).appendTo(translateItem);
    // スレッドへ追加する
    $('.sc-comment-stream-threads').append(translateItem);
};

// 翻訳処理
const translate = (sentences) => {
    // センテンスの数が1つの場合 -> 空文字を追加する
    if (sentences.length === 1) sentences.push('');
    // センテンスの数が一定以上の場合 -> キャンセル
    if (sentences.length > 20) {
        alert('Too many sentences.');
        return;
    }
    // スレッドの内容を空にする
    $('.sc-comment-stream-threads').empty();
    // それぞれのセンテンスを翻訳してリストへ格納する
    let outputList = [];
    for(let i = 0; i < sentences.length; i++) {
        const data = getTranslatedData(sentences[i]);
        outputList.push(data);
    }
    // 翻訳処理が全て完了した時点 -> 結果をスレッドへ表示する
    $.when.apply($, outputList).done(function() {
        // スレッドの内容を空にする
        $('.sc-comment-stream-threads').empty();
        for(let i = 0; i < arguments.length; i++) {
            // 翻訳に失敗したセンテンス -> スキップ
            if (arguments[i][0].code !== 200) continue;
            // 表示処理
            const text = arguments[i][0].text;
            addResult(sentences[i], text);
        }
    });
};

// マウスダウンイベント on PDF
$(document).on('mousedown', '.pdf-viewer', () => {
    state.mouseDownTime = performance.now();
});

// マウスアップイベント on PDF
$(document).on('mouseup', '.pdf-viewer', () => {
    // マウスダウンの時間が一定未満の場合 -> キャンセル
    const mouseUpTime = performance.now();
    if (mouseUpTime - state.mouseDownTime < 100) return;
    // 選択中のテキストを取得する
    let text = window.getSelection().toString();
    if (state.enableTakeOver) text = state.text + ' ' + text;
    // テキストを整形して翻訳する
    const sentences = formatText(text);
    if (state.enableTakeOver) state.text = sentences.join(' ');
    translate(sentences);
});

// キーダウンイベント
$(document).on('keydown', (e) => {
    // フォーカスされている場合 -> キャンセル
    if ($(':focus').length > 0) return;
    // Enterキー
    if (e.keyCode === 13) {
        // テキストの引き継ぎを無効化する
        if (state.enableTakeOver) {
            state.enableTakeOver = false;
            $('.message').remove();
        }
        // テキストの引き継ぎを有効化する
        else {
            state.enableTakeOver = true;
            const message = 'Enable translation by taking over text.';
            const element = $('<p>', { class: 'message', text: message });
            $('.sc-comment-editor-coach-mark-container').append(element);
        }
        state.text = '';
    }
    // 左キー -> ページアップ
    if (e.keyCode === 37) {
        $('[data-test="page-up"]').click();
        $(':focus').blur();
    }
    // 右キー -> ページダウン
    if (e.keyCode === 39) {
        $('[data-test="page-down"]').click();
        $(':focus').blur();
    }
});
