/**
 * The privacy page (/privacy): plain statements of what the site stores. Keep it true —
 * update it whenever analytics, cookies, accounts or a new email provider are added.
 * Prerendered to HTML at build time.
 * Uses: nothing from the app (content + CSS classes).
 */

export default function Privacy() {
  return (
    <div className="strategy">
      <h1 className="page-title">Privacy</h1>
      <p className="lead">
        LlamaPoker is built to work without knowing who you are. Here is everything it stores, and where.
      </p>

      <section className="strat-section">
        <div className="strat-head">
          <h2>What stays on your device</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Your hands and spots.</strong> Every calculation runs in your browser. The cards, ranges and chips
            you enter are never sent anywhere.
          </li>
          <li>
            <strong>Trainer stats.</strong> Your accuracy, streaks and recent decisions are saved in your browser's
            local storage so they're there next time. Clearing your browser data removes them; you can also reset
            them in the Trainer.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>What we keep</h2>
        </div>
        <ul className="strat-list">
          <li>
            <strong>Your email — only if you join the letter.</strong> We use it to send the LlamaPoker letter and nothing
            else. It's stored with Beehiiv, the service that sends the letter. We don't sell or share it.
          </li>
          <li>
            <strong>Anonymous visit counts.</strong> We use Cloudflare Web Analytics to see how many people visit and
            which pages they read. It sets no cookies and doesn't identify or follow you across sites.
          </li>
          <li>
            <strong>Unsubscribing.</strong> Every email has an unsubscribe link, or reply and ask — we'll delete your
            address.
          </li>
          <li>
            <strong>Where you came from.</strong> If a link brought you here (from a reel, a post or the letter), your
            browser keeps the name of that channel for the length of your visit, in its own session storage, so that if
            you join the letter we know which channel worked. It's a word like "instagram", not an identifier, and it's
            gone when you close the tab.
          </li>
          <li>
            <strong>Bot check on the signup form.</strong> To keep scripts off the list, the form may use Cloudflare
            Turnstile, which checks that a browser is real without a puzzle. It runs only on that form and keeps no
            profile of you.
          </li>
          <li>
            <strong>No tracking cookies, no ads, no accounts.</strong> If that ever changes, this page will say so
            first.
          </li>
        </ul>
      </section>

      <section className="strat-section">
        <div className="strat-head">
          <h2>Playing responsibly</h2>
        </div>
        <ul className="strat-list">
          <li>
            LlamaPoker is a study and training tool for adults (18+). Poker involves real financial risk — only play with
            money you can afford to lose, and use your poker site's limits and self-exclusion tools if you need them.
          </li>
          <li>
            Most online poker sites forbid real-time assistance tools during play. Use LlamaPoker to study, review and
            train — not at a real-money table.
          </li>
        </ul>
      </section>
    </div>
  );
}
