<svelte:head>
  <title>プライバシーポリシー | 集中タイマー × BGM</title>
</svelte:head>

<div class="page">
  <header class="page-header">
    <h1>プライバシーポリシー</h1>
    <p class="page-desc">最終更新: 2025年5月</p>
  </header>

  <main class="content">
    <section>
      <h2>基本方針</h2>
      <p>
        集中タイマー × BGM（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の適切な取り扱いに努めます。
      </p>
    </section>

    <section>
      <h2>収集する情報</h2>
      <ul>
        <li>本サービスはユーザーの個人情報を収集・保存しません。</li>
        <li>タイマー設定やBGMの選択はお使いの端末上でのみ処理されます。</li>
        <li>Cloudflare のインフラによりIPアドレスなどの標準的なアクセスログが記録される場合があります。</li>
      </ul>
    </section>

    <section>
      <h2>外部サービスの利用</h2>
      <ul>
        <li><strong>YouTube IFrame API</strong>: BGMの再生にYouTubeの動画プレーヤーを使用します。YouTubeのプライバシーポリシーが適用されます。</li>
        <li><strong>YouTube Data API</strong>: BGM動画の検索に使用します。検索クエリのみが送信され、個人を特定できる情報は含まれません。</li>
      </ul>
    </section>

    <section>
      <h2>広告について</h2>
      <p>
        本サービスはGoogle AdSense（Googleが提供する広告配信サービス）を利用しています。
        GoogleはCookieを使用してユーザーに関連性の高い広告を表示する場合があります。
      </p>
      <p>
        Googleの広告Cookieの利用を無効にするには
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
          Google 広告設定
        </a>
        をご覧ください。
      </p>
    </section>

    <section>
      <h2>Cookieの使用</h2>
      <p>
        本サービス自体はCookieを使用しません。ただし、Google AdSenseおよびYouTubeが各サービスの目的のためにCookieを使用します。
      </p>
    </section>

    <section>
      <h2>お問い合わせ</h2>
      <p>プライバシーポリシーに関するご質問はGitHubのIssueよりお問い合わせください。</p>
    </section>
  </main>

  <footer class="page-footer">
    <a href="/" class="back-link">← トップに戻る</a>
    <p class="footer-note">© 集中タイマー × BGM</p>
  </footer>
</div>

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
    color: var(--text-muted);
  }

  .page-desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
    opacity: 0.7;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  section {
    border-bottom: 1px solid var(--border);
    padding-bottom: 20px;
  }

  h2 {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin: 0 0 10px;
  }

  p, li {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.7;
    margin: 0 0 8px;
  }

  ul {
    padding-left: 20px;
    margin: 0;
  }

  a {
    color: var(--accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  .page-footer {
    margin-top: 32px;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .back-link {
    font-size: 13px;
    color: var(--accent);
  }

  .footer-note {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.5;
  }
</style>
