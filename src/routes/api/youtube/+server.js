import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * カテゴリ別の検索クエリ。
 * YouTube Data API は exact-duration フィルタを持たないため、
 * クエリで意図を伝え、後段の videoDuration で粗く絞り込む。
 */
const CATEGORY_QUERIES = {
  lofi: 'lofi hip hop study work BGM',
  chill: 'chill ambient study music long mix',
  synthwave: 'synthwave radio mix',
  nature: '自然音 環境音 リラックス',
  jazz: 'cafe jazz BGM long mix',
  classical: 'classical music for studying long'
};

/**
 * APIキー未設定 / クォータ超過時に使う、安定して埋め込み可能なフォールバック動画ID。
 * Lofi Girl の 24/7 ストリームは長時間用途で信頼性が高い。
 */
const FALLBACK_VIDEO_ID = 'jfKfPfyJRdk';

/**
 * GET /api/youtube?category=lofi&minutes=25&skip=id1,id2
 *
 * - category: BGM のカテゴリ (CATEGORY_QUERIES のキー)
 * - minutes:  タイマー時間（分）。動画の長さフィルタを決定
 * - skip:     直前に流れたVideo ID。スキップ機能で重複を避けるため
 *
 * 返却: { videoId, title, channel, source: 'youtube' | 'fallback' }
 */
export async function GET({ url, fetch: serverFetch }) {
  const category = url.searchParams.get('category') || 'lofi';
  const minutes = Math.max(1, parseInt(url.searchParams.get('minutes') || '25', 10));
  const skipIds = (url.searchParams.get('skip') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.lofi;

  // 4分未満ならmedium (4-20分)、それ以上ならlong (20分超) 固定。
  // 多くの作業用BGMは1時間以上のミックスなので long を優先し、
  // タイマー終了時にこちら側で停止させる戦略を取る。
  const videoDuration = minutes < 4 ? 'medium' : 'long';

  // APIキー未設定 → フォールバック (開発時に APIキーなしでも動かせるように)
  if (!env.YOUTUBE_API_KEY) {
    return json(buildFallback('APIキー未設定'));
  }

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  apiUrl.searchParams.set('part', 'snippet');
  apiUrl.searchParams.set('q', query);
  apiUrl.searchParams.set('type', 'video');
  apiUrl.searchParams.set('videoDuration', videoDuration);
  apiUrl.searchParams.set('videoEmbeddable', 'true');
  apiUrl.searchParams.set('safeSearch', 'moderate');
  apiUrl.searchParams.set('maxResults', '15');
  apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY);

  let res;
  try {
    res = await serverFetch(apiUrl);
  } catch (err) {
    console.error('[api/youtube] fetch failed:', err);
    return json(buildFallback('YouTube API への接続に失敗'));
  }

  // 403 = クォータ超過 or キー無効 → フォールバックで動作継続
  if (res.status === 403) {
    console.warn('[api/youtube] 403 received - falling back');
    return json(buildFallback('レート制限到達'));
  }

  if (!res.ok) {
    throw error(res.status, `YouTube API error (${res.status})`);
  }

  /** @type {{ items?: Array<{ id: { videoId: string }, snippet: { title: string, channelTitle: string } }> }} */
  const data = await res.json();
  const items = (data.items || [])
    .filter((it) => it?.id?.videoId)
    .map((it) => ({
      videoId: it.id.videoId,
      title: it.snippet.title,
      channel: it.snippet.channelTitle
    }))
    .filter((v) => !skipIds.includes(v.videoId));

  if (items.length === 0) {
    return json(buildFallback('該当動画なし'));
  }

  // 上位5件からランダムに1本選んで多様性を出す
  const pool = items.slice(0, 5);
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return json({
    ...pick,
    source: /** @type {const} */ ('youtube')
  });
}

/**
 * @param {string} reason フォールバックを使った理由（ログ・デバッグ用）
 */
function buildFallback(reason) {
  console.info(`[api/youtube] fallback used: ${reason}`);
  return {
    videoId: FALLBACK_VIDEO_ID,
    title: 'lofi hip hop radio - beats to relax/study to',
    channel: 'Lofi Girl',
    source: /** @type {const} */ ('fallback')
  };
}
