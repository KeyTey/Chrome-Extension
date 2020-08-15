// 状態
const state = { scrollTop: 0 };

// マウスダウンイベント
$(document).on('mousedown', () => {
    // スクロール位置を保持する
    state.scrollTop = $(window).scrollTop();
});

// クリックイベント
$(document).on('click', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    // PIP中に画面トップまで戻った場合 -> 元のスクロール位置へ戻る
    if (document.pictureInPictureElement === null) return;
    if ($(window).scrollTop() !== 0) return;
    $(window).scrollTop(state.scrollTop);
});

// チャンネル動画停止用オブザーバー
const videoStopObserver = new MutationObserver(() => {
    // チャンネル登録済みの場合 -> キャンセル
    const subscribed = $('app-header').find('[subscribed]');
    if (subscribed.length > 0) videoStopObserver.disconnect();
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

// タブ更新イベント
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 初期化
    if (message.status !== 'complete') return;
    videoStopObserver.disconnect();
    document.exitPictureInPicture().catch(() => {});
    // チャンネルページ以外の場合 -> キャンセル
    const pathList = location.pathname.split('/').filter(path => path !== '');
    if (pathList.length === 0) return;
    const channelPaths = ['c', 'channel', 'user'];
    if (channelPaths.includes(pathList[0]) === false) return;
    const lastPath = pathList.slice(-1)[0];
    if (pathList.length !== 2 && lastPath !== 'featured') return;
    // チャンネル動画を停止する
    const options = { childList: true, subtree: true };
    videoStopObserver.observe(document, options);
});
