<script>
  import Timer from '$lib/components/Timer.svelte';
  import BgmPlayer from '$lib/components/BgmPlayer.svelte';

  /** @type {BgmPlayer} */
  let bgmPlayer;

  let toastMsg = '';
  /** @type {ReturnType<typeof setTimeout> | null} */
  let toastTimer = null;
  let isRunning = false;

  /**
   * @param {string} msg
   */
  function showToast(msg) {
    toastMsg = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg = ''), 3000);
  }

  /**
   * @param {CustomEvent<{ minutes: number }>} e
   */
  function onTimerStart(e) {
    isRunning = true;
    if (bgmPlayer) bgmPlayer.loadAndPlay(e.detail.minutes);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function onTimerPause() {
    isRunning = false;
    if (bgmPlayer) bgmPlayer.pause();
  }

  function onTimerFinish() {
    isRunning = false;
    if (bgmPlayer) bgmPlayer.stop();
    playAlarm();
    showToast('⏰ タイマー終了！お疲れさまでした');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('タイマー終了', { body: 'お疲れさまでした！' });
    }
  }

  function onTimerReset() {
    isRunning = false;
    if (bgmPlayer) bgmPlayer.stop();
  }

  function playAlarm() {
    try {
      const Ctx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      [0, 0.45, 0.9].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + delay + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      });
    } catch (err) {
      console.warn('Alarm sound failed:', err);
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <h1>
      <span class="status-dot" class:running={isRunning} aria-hidden="true"></span>
      集中タイマー × BGM
    </h1>
    <p class="page-desc">タイマーをスタートすると作業用BGMが自動再生されます</p>
  </header>

  <!-- ▼ Google AdSense 上部バナー広告 (728×90 リーダーボード) -->
  <!-- app.html の AdSense スクリプトを有効化した後、下記コメントを外してください -->
  <!-- data-ad-client と data-ad-slot はご自身の値に置き換えてください -->
  <div class="ad-slot ad-slot--top">
    <!--
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
         data-ad-slot="XXXXXXXXXX"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    -->
  </div>
  <!-- ▲ 広告ここまで -->

  <main>
    <Timer
      on:start={onTimerStart}
      on:pause={onTimerPause}
      on:finish={onTimerFinish}
      on:reset={onTimerReset} />

    <!-- ▼ Google AdSense 中間広告 (タイマーとBGMの間) -->
    <div class="ad-slot ad-slot--middle">
      <!--
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="XXXXXXXXXX"
           data-ad-format="rectangle"
           data-full-width-responsive="false"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      -->
    </div>
    <!-- ▲ 広告ここまで -->

    <BgmPlayer bind:this={bgmPlayer} />
  </main>

  <footer class="page-footer">
    <!-- ▼ Google AdSense フッター広告 (728×90 リーダーボード) -->
    <div class="ad-slot ad-slot--bottom">
      <!--
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="XXXXXXXXXX"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      -->
    </div>
    <!-- ▲ 広告ここまで -->
    <p class="footer-note">© 集中タイマー × BGM</p>
    <a href="/privacy" class="privacy-link">プライバシーポリシー</a>
  </footer>
</div>

{#if toastMsg}
  <div class="toast" role="status">{toastMsg}</div>
{/if}

<style>
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 24px 40px;
  }

  .page-header {
    padding: 32px 0 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }

  h1 {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 6px;
    letter-spacing: 0.02em;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  .page-desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
    opacity: 0.7;
  }

  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
    margin-right: 8px;
    transition: background 0.3s;
  }
  .status-dot.running {
    background: var(--success);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  main {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ─── AdSense スロット ─── */
  .ad-slot {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .ad-slot--top {
    margin-bottom: 20px;
    min-height: 0; /* 広告なしのときに余白を作らない */
  }
  .ad-slot--middle {
    margin: 16px 0;
    min-height: 0;
  }
  .ad-slot--bottom {
    margin-bottom: 16px;
    min-height: 0;
  }
  /* 広告が挿入されたとき（ins要素が子に存在）は高さを確保 */
  .ad-slot:has(> ins) {
    min-height: 90px;
  }

  .page-footer {
    margin-top: 32px;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    text-align: center;
  }

  .footer-note {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.5;
  }

  .privacy-link {
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.6;
    text-decoration: none;
  }
  .privacy-link:hover {
    opacity: 1;
  }

  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    color: var(--text);
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
    white-space: nowrap;
  }
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(120%); opacity: 0; }
    to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
  }
</style>
