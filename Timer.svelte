<script>
  import { createEventDispatcher, onDestroy } from 'svelte';

  const dispatch = createEventDispatcher();

  const PRESETS = [5, 15, 25, 45, 60, 90];

  let inputMin = 25;
  let inputSec = 0;
  let totalSeconds = 25 * 60;
  let remaining = 25 * 60;
  let isRunning = false;
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;
  let justFinished = false;

  $: progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  /**
   * @param {number} s
   */
  function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function syncFromInputs() {
    const total = (Number(inputMin) || 0) * 60 + (Number(inputSec) || 0);
    totalSeconds = total;
    remaining = total;
  }

  /**
   * 入力変更ハンドラ。実行中は無視。
   */
  function onInputChange() {
    if (isRunning) return;
    // 秒は 0-59 に丸める
    inputSec = Math.min(59, Math.max(0, Number(inputSec) || 0));
    inputMin = Math.max(0, Number(inputMin) || 0);
    syncFromInputs();
    justFinished = false;
  }

  /**
   * @param {number} min
   */
  function selectPreset(min) {
    if (isRunning) return;
    inputMin = min;
    inputSec = 0;
    syncFromInputs();
    justFinished = false;
  }

  function start() {
    if (isRunning) {
      pause();
      return;
    }
    // アイドル（未開始）または終了後はインプットから読み直す
    // → 入力直後に blur 前で start を押されても最新値で動く
    if (remaining === totalSeconds || remaining <= 0) {
      syncFromInputs();
    }
    if (remaining <= 0) return;
    isRunning = true;
    justFinished = false;
    dispatch('start', { minutes: Math.ceil(totalSeconds / 60) });

    intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        finish();
      }
    }, 1000);
  }

  function pause() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    dispatch('pause');
  }

  function reset() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    justFinished = false;
    syncFromInputs();
    dispatch('reset');
  }

  function finish() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    justFinished = true;
    dispatch('finish');
  }

  // タブタイトル更新
  $: if (typeof document !== 'undefined') {
    document.title = isRunning
      ? `${format(remaining)} - 集中タイマー`
      : '集中タイマー × BGM';
  }

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });

  // スペースキーでスタート/一時停止
  /** @type {(e: KeyboardEvent) => void} */
  function onKeydown(e) {
    if (e.code !== 'Space') return;
    const t = /** @type {HTMLElement} */ (e.target);
    if (t && (t.tagName === 'INPUT' || t.tagName === 'BUTTON')) return;
    e.preventDefault();
    start();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="timer-card">
  <div class="time-display" class:ended={justFinished}>{format(remaining)}</div>

  <div class="progress-bar">
    <div class="progress-fill" style:width="{progress}%"></div>
  </div>

  <div class="time-input">
    <label>分<input
        type="number"
        min="0"
        max="180"
        bind:value={inputMin}
        on:change={onInputChange}
        disabled={isRunning} /></label>
    <span>:</span>
    <label>秒<input
        type="number"
        min="0"
        max="59"
        bind:value={inputSec}
        on:change={onInputChange}
        disabled={isRunning} /></label>
  </div>

  <div class="presets">
    {#each PRESETS as min}
      <button
        class="preset-btn"
        class:active={!isRunning && inputMin === min && inputSec === 0}
        on:click={() => selectPreset(min)}
        disabled={isRunning}>
        {min}分{min === 25 ? ' (Pomodoro)' : ''}
      </button>
    {/each}
  </div>

  <div class="controls">
    <button class="btn-primary" on:click={start}>
      {isRunning ? '一時停止' : 'スタート'}
    </button>
    <button class="btn-secondary" on:click={reset}>リセット</button>
  </div>
</div>

<style>
  .timer-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 48px 32px 32px;
    margin-bottom: 24px;
  }

  .time-display {
    font-size: 88px;
    font-weight: 200;
    text-align: center;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    transition: color 0.3s;
  }
  .time-display.ended {
    color: var(--accent);
    animation: flash 0.8s ease-in-out 3;
  }
  @keyframes flash {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .progress-bar {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin: 0 auto 32px;
    max-width: 320px;
  }
  .progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s linear;
  }

  .time-input {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .time-input label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .time-input input {
    width: 72px;
    padding: 10px 12px;
    font-size: 18px;
    text-align: center;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-variant-numeric: tabular-nums;
    transition: border-color 0.15s;
  }
  .time-input input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .time-input input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .time-input span {
    color: var(--text-muted);
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 24px;
  }
  .preset-btn {
    padding: 8px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .preset-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .preset-btn.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: transparent;
  }
  .preset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .controls {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
  .btn-primary,
  .btn-secondary {
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 120px;
  }
  .btn-primary {
    background: var(--accent);
    color: #fff;
    border: none;
  }
  .btn-primary:hover {
    filter: brightness(1.1);
  }
  .btn-primary:active {
    transform: scale(0.98);
  }
  .btn-secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border-strong);
  }
  .btn-secondary:hover {
    background: var(--surface-2);
  }

  @media (max-width: 600px) {
    .time-display {
      font-size: 64px;
    }
    .timer-card {
      padding: 32px 20px 24px;
    }
    .controls {
      flex-direction: column;
    }
    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }
</style>
