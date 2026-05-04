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

    // 通知許可をリクエスト（初回のみ）
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

  /**
   * Web Audio API でアラーム音を生成（外部ファイル不要）
   */
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

<main>
  <header>
    <h1>
      <span class="status-dot" class:running={isRunning} aria-hidden="true"></span>
      集中タイマー × BGM
    </h1>
  </header>

  <Timer
    on:start={onTimerStart}
    on:pause={onTimerPause}
    on:finish={onTimerFinish}
    on:reset={onTimerReset} />

  <BgmPlayer bind:this={bgmPlayer} />
</main>

{#if toastMsg}
  <div class="toast" role="status">{toastMsg}</div>
{/if}

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 80px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  h1 {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
    letter-spacing: 0.02em;
    color: var(--text-muted);
    display: flex;
    align-items: center;
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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
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
  }
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(120%);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 600px) {
    main {
      padding: 20px 16px 60px;
    }
  }
</style>
