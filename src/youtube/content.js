// 状態
const state = { scrollTop: 0 };

// マウスダウンイベント: シンプルリンク
$(document).on('mousedown', '.yt-simple-endpoint', () => {
    // スクロール位置を保持する
    state.scrollTop = $(window).scrollTop();
});

// クリックイベント: シンプルリンク
$(document).on('click', '.yt-simple-endpoint', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // PIP中に画面トップまで戻った場合 -> 元のスクロール位置へ戻る
    if (document.pictureInPictureElement === null) return;
    if ($(window).scrollTop() !== 0) return;
    $(window).scrollTop(state.scrollTop);
});

// 動画フィルターボタンを追加する
const addVideoFilterButton = () => {
    $('.video-filter-btn').remove();
    const menu = $('#title-container #menu');
    if ($(menu).length === 0) return;
    const icon = $('<yt-icon>');
    const iconButton = $('<yt-icon-button>', { class: 'video-filter-btn', title: 'Filter Videos', type: 'disabled' });
    $(iconButton).append(icon);
    $(menu).first().before(iconButton);
    $(icon).html('<svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"></path></svg>');
};

// クリックイベント: 動画フィルターボタン
$(document).on('click', '.video-filter-btn', () => {
    const button = $('.video-filter-btn');
    const type = $(button).attr('type') === 'disabled' ? 'enabled' : 'disabled';
    $(button).attr('type', type);
    // フィルターが有効の場合 -> 配信情報のみ表示する
    if (type === 'enabled') {
        $('ytd-section-list-renderer').addClass('video-filter-enabled');
        $('ytd-grid-video-renderer').each((_, item) => {
            // 配信中の場合 -> キャンセル
            const badge = $(item).find('.badge-style-type-live-now');
            if ($(badge).length > 0) return;
            // 配信予約の場合 -> キャンセル
            const reminder = $(item).find('ytd-toggle-button-renderer');
            if ($(reminder).length > 0) return;
            // アイテムを非表示にする
            $(item).addClass('hidden');
        });
    }
    // フィルターが無効の場合 -> リセット
    if (type === 'disabled') {
        $('ytd-section-list-renderer').removeClass('video-filter-enabled');
        $('ytd-grid-video-renderer').removeClass('hidden');
    }
});

// キーダウンイベント: ドキュメント
$(document).on('keydown', (e) => {
    // 修飾キーの場合 -> キャンセル
    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
    // ライブチャットフローの表示を切り替える
    if (e.key === '=') {
        // コントロールボタンをクリックする
        const button = $('.ylcf-control-button');
        if ($(button).length === 0) return;
        $(button).click();
        $(button).data('timestamp', performance.now());
        // プレーヤーのバーを表示する
        const player = $('.html5-video-player');
        $(player).removeClass('ytp-autohide');
        // プレーヤーのバーを数秒後に非表示にする
        setTimeout(() => {
            const before = $(button).data('timestamp');
            const after = performance.now();
            if (after - before < 2000) return;
            $(player).addClass('ytp-autohide');
        }, 2000);
    }
});

// キーダウンイベント: テキストエリア
$(document).on('keydown', 'input, textarea, .input-content', (e) => e.stopPropagation());

// チャンネル動画停止用オブザーバー
const videoStopObserver = new MutationObserver(() => {
    // 動画が存在しない場合 -> キャンセル
    const video = $('ytd-channel-video-player-renderer').find('video');
    if ($(video).length === 0) return;
    // 動画の準備が未完了の場合 -> キャンセル
    const videoElement = $(video).get(0);
    if (videoElement.paused) return;
    // 動画を停止する
    videoElement.pause();
    videoStopObserver.disconnect();
});

// 初期化
const initialize = () => {
    videoStopObserver.disconnect();
    document.exitPictureInPicture().catch(() => {});
    // チャンネルページの場合 -> チャンネル動画を停止する
    const pathList = location.pathname.split('/').filter(path => path !== '');
    const firstPath = pathList.length ? pathList[0] : '';
    const channelPaths = ['c', 'channel', 'user'];
    if (channelPaths.includes(firstPath)) {
        const options = { childList: true, subtree: true };
        videoStopObserver.observe(document, options);
    }
    // 登録チャンネルページの場合 -> 動画フィルターボタンを追加する
    if (location.pathname === '/feed/subscriptions') {
        $('ytd-section-list-renderer').removeClass('video-filter-enabled');
        $('ytd-grid-video-renderer').removeClass('hidden');
        addVideoFilterButton();
    }
};

// チャットを更新する
const reloadChat = () => {
    if (location.pathname !== '/watch') return;
    const button = $('#show-hide-button').find('paper-button');
    Promise.resolve()
    .then(() => new Promise((resolve) => {
        // チャット非表示ボタンをクリックする
        if ($(button).length === 0) return;
        $(button).click();
        resolve();
    }))
    .then(() => new Promise(() => {
        // チャット表示ボタンをクリックする
        if ($(button).length === 0) return;
        $(button).click();
    }));
};

// メッセージイベント
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // タブが更新された場合
    if (message.type === 'UPDATED') initialize();
    // チャット更新ボタンが押された場合
    if (message.type === 'RELOAD_CHAT') reloadChat();
});
