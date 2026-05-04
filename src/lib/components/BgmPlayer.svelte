<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let category = 'lofi';

  const CATEGORIES = [
    { id: 'lofi', label: 'Lo-Fi', desc: '作業に最適な定番' },
    { id: 'chill', label: 'Chill', desc: '深い集中向け' },
    { id: 'synthwave', label: 'Synthwave', desc: 'ノリ良く作業' },
    { id: 'nature', label: '自然音', desc: '雨・森・水音' },
    { id: 'jazz', label: 'Jazz', desc: 'カフェの空気' },
    { id: 'classical', label: 'Classical', desc: '静かな集中' }
  ];

  /** @type {HTMLDivElement} */
  let containerEl;
  /** @type {any} */
  let player = null;
  let ytReady = false;
  let pendingPlayId = '';

  let currentVideoId = '';
  let currentTitle = '';
  let currentChannel = '';
  let currentSource = ''; // 'youtube' | 'fallback' | ''
  let isLoading = false;
  let errorMsg = '';

  /** 直前に流したVideo IDの履歴。スキップ時に重複を避ける用 */
  let recentIds = /** @type {string[]} */ ([]);

  let volume = 50;
  let isMuted = false;

  onMount(() => {
    loadIframeApi();
    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (_) {
          // ignore
        }
      }
    };
  });

  function loadIframeApi() {
    if (typeof window === 'undefined') return;
    // すでに API が読み込まれている
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    // すでに <script> タグがある
    if (document.getElementById('yt-iframe-api')) {
      window.onYouTubeIframeAPIReady = initPlayer;
      return;
    }
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
  }

  function initPlayer() {
    if (!containerEl) return;
    player = new window.YT.Player(containerEl, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: () => {
          ytReady = true;
          player.setVolume(volume);
          if (pendingPlayId) {
            player.loadVideoById(pendingPlayId);
            pendingPlayId = '';
          }
        },
        onError: (/** @type {{ data: number }} */ e) => {
          errorMsg = `動画再生エラー (code ${e.data})`;
          dispatch('error', { code: e.data });
        }
      }
    });
  }

  /**
   * APIを叩いて動画を取得し、すぐ再生する。親（+page.svelte）から呼ぶ。
   * @param {number} minutes
   */
  export async function loadAndPlay(minutes) {
    isLoading = true;
    errorMsg = '';

    const params = new URLSearchParams({
      category,
      minutes: String(minutes)
    });
    if (recentIds.length) params.set('skip', recentIds.join(','));

    try {
      const res = await fetch(`/api/youtube?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      applyVideo(data);
      playInternal(data.videoId);
    } catch (err) {
      console.error('[BgmPlayer] fetch error:', err);
      errorMsg = 'BGM の取得に失敗しました';
    } finally {
      isLoading = false;
    }
  }

  /**
   * 別のBGMにスキップ（再検索して入れ替え）。タイマーが動いていればそのまま再生継続。
   */
  async function skip() {
    isLoading = true;
    errorMsg = '';
    const minutes = 25; // スキップ時は標準的な長さで検索
    const params = new URLSearchParams({
      category,
      minutes: String(minutes),
      skip: recentIds.join(',')
    });
    try {
      const res = await fetch(`/api/youtube?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      applyVideo(data);
      playInternal(data.videoId);
    } catch (err) {
      console.error('[BgmPlayer] skip error:', err);
      errorMsg = '次のBGMの取得に失敗しました';
    } finally {
      isLoading = false;
    }
  }

  /**
   * @param {{ videoId: string, title: string, channel: string, source: string }} data
   */
  function applyVideo(data) {
    currentVideoId = data.videoId;
    currentTitle = data.title;
    currentChannel = data.channel;
    currentSource = data.source;
    // 直近5件まで履歴
    recentIds = [data.videoId, ...recentIds.filter((id) => id !== data.videoId)].slice(0, 5);
  }

  /**
   * @param {string} id
   */
  function playInternal(id) {
    if (!ytReady || !player) {
      pendingPlayId = id;
      return;
    }
    player.loadVideoById(id);
  }

  // タイマーの一時停止 / 終了 / リセットから呼ばれる
  export function pause() {
    if (ytReady && player) player.pauseVideo();
  }
  export function stop() {
    if (ytReady && player) player.stopVideo();
  }

  /**
   * @param {Event} e
   */
  function onVolumeInput(e) {
    const v = Number(/** @type {HTMLInputElement} */ (e.target).value);
    volume = v;
    if (ytReady && player) player.setVolume(v);
    if (v > 0 && isMuted) {
      isMuted = false;
      player.unMute();
    }
  }

  function toggleMute() {
    if (!ytReady || !player) return;
    isMuted = !isMuted;
    if (isMuted) player.mute();
    else player.unMute();
  }

  /**
   * @param {string} id
   */
  function selectCategory(id) {
    category = id;
    // カテゴリ変更時は履歴をリセット（別ジャンルなので）
    recentIds = [];
  }
</script>

<div class="bgm-card">
  <div class="bgm-header">
    <h2 class="bgm-title">BGM</h2>
    <div class="now-playing" title={currentTitle}>
      {#if isLoading}
        読み込み中…
      {:else if currentTitle}
        {currentTitle}{#if currentChannel} — {currentChannel}{/if}
      {:else}
        未選択
      {/if}
    </div>
  </div>

  <div class="categories">
    {#each CATEGORIES as cat}
      <button
        class="cat-btn"
        class:active={category === cat.id}
        on:click={() => selectCategory(cat.id)}>
        <span class="label">{cat.label}</span>
        <span class="desc">{cat.desc}</span>
      </button>
    {/each}
  </div>

  <div class="player-wrap" class:empty={!currentVideoId}>
    <div bind:this={containerEl}></div>
  </div>

  {#if errorMsg}
    <div class="error">{errorMsg}</div>
  {:else if currentSource === 'fallback'}
    <div class="notice">
      ※ APIキー未設定 or レート制限のためプリセットBGMで再生中
    </div>
  {/if}

  <div class="audio-controls">
    <button class="icon-btn" on:click={toggleMute} title="ミュート" class:muted={isMuted}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        {#if !isMuted}
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        {:else}
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        {/if}
      </svg>
    </button>
    <input
      type="range"
      class="volume-slider"
      min="0"
      max="100"
      value={volume}
      on:input={onVolumeInput} />
    <span class="volume-value">{volume}%</span>
    <button class="icon-btn" on:click={skip} title="次のBGM" disabled={isLoading}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 4 15 12 5 20 5 4"></polygon>
        <line x1="19" y1="5" x2="19" y2="19"></line>
      </svg>
    </button>
  </div>
</div>

<style>
  .bgm-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
  }
  .bgm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
  .bgm-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .now-playing {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .categories {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }
  .cat-btn {
    padding: 12px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }
  .cat-btn:hover {
    border-color: var(--border-strong);
  }
  .cat-btn.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: transparent;
  }
  .cat-btn .label {
    font-weight: 500;
    display: block;
    margin-bottom: 2px;
  }
  .cat-btn .desc {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
  }
  .cat-btn.active .desc {
    color: var(--accent);
    opacity: 0.8;
  }

  .player-wrap {
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    margin-bottom: 12px;
    aspect-ratio: 16 / 9;
    position: relative;
  }
  .player-wrap.empty::before {
    content: 'タイマーをスタートするとBGMが再生されます';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }
  .player-wrap > :global(div) {
    width: 100%;
    height: 100%;
  }

  .error {
    background: rgba(255, 122, 122, 0.1);
    border: 1px solid rgba(255, 122, 122, 0.3);
    color: var(--danger);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .notice {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 12px;
    padding: 6px 10px;
    background: var(--surface-2);
    border-radius: 6px;
  }

  .audio-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .icon-btn:hover:not(:disabled) {
    background: var(--surface-2);
    border-color: var(--border-strong);
  }
  .icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .icon-btn.muted {
    color: var(--text-muted);
  }
  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .volume-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    outline: none;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
  .volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
  }
  .volume-value {
    min-width: 36px;
    text-align: right;
    font-size: 12px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 600px) {
    .categories {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
