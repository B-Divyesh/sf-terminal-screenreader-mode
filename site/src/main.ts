import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
const origin = "https://terminal-screenreader-mode.sociobot.in";

const transcript = [
  ["text", "Starting accessible build"],
  ["heading", "Build results"],
  ["text", "18 checks passed"],
  ["text", "Report: https://example.test/build/42"],
  ["link", "https://example.test/build/42"],
  ["text", "Finished without errors"],
] as const;

const titleByPath: Record<string, string> = {
  "/": "Terminal Screenreader Mode — Stable CLI output",
  "/demo": "Demo — Terminal Screenreader Mode",
  "/privacy": "Privacy — Terminal Screenreader Mode",
  "/terms": "Terms — Terminal Screenreader Mode",
  "/404": "Page not found — Terminal Screenreader Mode",
};

function shell(content: string, demo = false): string {
  return `
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-route aria-label="Terminal Screenreader Mode home">
        <img src="/favicon.svg" width="32" height="32" alt="" />
        <span>TSRM</span><span class="wordmark-long"> / screenreader mode</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-route>Demo</a>
        <a class="nav-install" href="/#install" data-route>Install</a>
        <a href="/privacy" data-route>Privacy</a>
      </nav>
    </header>
    <div class="offline-note" role="status" hidden>Docs are offline. This saved page and the local CLI remain available.</div>
    ${demo ? demoBanner() : ""}
    ${content}
    <footer>
      <p>Stable terminal output for screen-reader users.</p>
      <div class="footer-links">
        <a href="/privacy" data-route>Privacy</a>
        <a href="/terms" data-route>Terms</a>
        <a href="https://hello-factory.sociobot.in">Built by Param Factory <span class="sr-only">(external site)</span></a>
      </div>
      <p class="build-id">v0.1.0 · build 1</p>
    </footer>
    <div class="route-status sr-only" aria-live="polite"></div>`;
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo status">
    <span><strong>Demo</strong> — sample data, nothing is saved</span>
    <div><button type="button" data-action="reset-demo">Reset demo</button><a href="/#install" data-route>Start for real</a></div>
  </aside>`;
}

function terminalRecording(showAll: boolean, homePreview = false): string {
  const lines = transcript.map(([kind, text], index) => {
    const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
    return `<li class="terminal-line ${showAll ? "is-visible" : ""}" data-line="${index}"><span class="line-kind">${kind}</span><span>${escaped}</span></li>`;
  }).join("");
  return `<div class="terminal-block ${homePreview ? "home-terminal" : ""}" data-recording>
    <div class="terminal-topline"><span>tsrm demo --no-timestamps</span><span aria-label="Local process">LOCAL / 6 LINES</span></div>
    <div class="terminal-controls" aria-label="Recording controls">
      <button type="button" data-action="play">Play recording</button>
      <button type="button" data-action="pause">Pause</button>
      <button type="button" data-action="reset-output">Clear output</button>
    </div>
    <ol class="transcript" tabindex="0" aria-label="Stable sample transcript" aria-live="polite">${lines}</ol>
    <p class="empty-output" ${showAll ? "hidden" : ""}>The stable transcript will appear here. Select Play recording.</p>
  </div>`;
}

function homePage(): string {
  return shell(`<main id="main" tabindex="-1">
    <section class="hero" aria-labelledby="home-heading">
      <div class="hero-copy">
        <p class="eyebrow">Local CLI adapter · v0.1.0</p>
        <h1 id="home-heading">Read streaming commands without losing your place</h1>
        <p class="hero-summary">For screen-reader users, tsrm turns changing terminal output into stable lines you can revisit.</p>
        <div class="hero-action"><a class="button primary" href="/demo" data-route>Try it with sample data</a><span>See a noisy build become six stable lines.</span></div>
        <ul class="facts" aria-label="Product facts">
          <li>Runs on your device</li>
          <li>Saves nothing by default</li>
          <li>Free under MIT</li>
        </ul>
      </div>
      <picture class="hero-art">
        <source media="(max-width: 640px)" srcset="/assets/signal-recovery-640.webp" />
        <img src="/assets/signal-recovery.webp" width="1200" height="800" fetchpriority="high" alt="Amber terminal noise passes through an adapter and becomes ordered mint transcript rows." />
      </picture>
    </section>
    <section class="product-preview" aria-labelledby="preview-heading">
      <div class="section-label"><span>01</span><h2 id="preview-heading">Hear the final line, not every spinner frame</h2></div>
      ${terminalRecording(true, true)}
      <p class="preview-note">The recording uses the bundled sample processed by the real CLI. Its controls work with a keyboard.</p>
    </section>
    <section class="how" aria-labelledby="how-heading">
      <div class="section-label"><span>02</span><h2 id="how-heading">How it works</h2></div>
      <ol class="steps">
        <li><span class="step-number">01</span><div><h3>Wrap your command</h3><p>Place <code>tsrm run --</code> before the command you already use.</p></div></li>
        <li><span class="step-number">02</span><div><h3>Replace volatile rows</h3><p>ANSI controls disappear. Carriage returns replace the pending row.</p></div></li>
        <li><span class="step-number">03</span><div><h3>Read stable records</h3><p>Headings, errors, and links receive plain labels in the transcript.</p></div></li>
      </ol>
    </section>
    <section class="install" id="install" aria-labelledby="install-heading">
      <div class="section-label"><span>03</span><h2 id="install-heading">Install the local CLI</h2></div>
      <div class="install-grid">
        <div><p>Build with Rust 1.85 or newer. No account or service key is needed.</p><a class="text-link" href="https://github.com/B-Divyesh/sf-terminal-screenreader-mode">Read the source on GitHub <span class="sr-only">(external site)</span></a></div>
        <div class="command-box"><code tabindex="0" aria-label="Install command">cargo install --git https://github.com/B-Divyesh/sf-terminal-screenreader-mode</code><button type="button" data-copy="cargo install --git https://github.com/B-Divyesh/sf-terminal-screenreader-mode">Copy install command</button></div>
      </div>
      <p class="copy-status" role="status" aria-live="polite"></p>
    </section>
    <section class="boundaries" aria-labelledby="boundaries-heading">
      <div class="section-label"><span>04</span><h2 id="boundaries-heading">What stays outside the tool</h2></div>
      <div class="boundary-copy"><p>tsrm does not speak, emulate a terminal, or send output to a server.</p><p>Full-screen interactive apps may not produce a useful linear transcript. Use their own accessibility mode when available.</p><p>Compatibility pilots with NVDA, JAWS, and VoiceOver are the next release gate.</p></div>
    </section>
  </main>`);
}

function demoPage(): string {
  return shell(`<main id="main" tabindex="-1" class="demo-main">
    <section class="demo-intro">
      <p class="eyebrow">Bundled sandbox</p>
      <h1>Turn noisy sample output into stable lines</h1>
      <p>This recording uses a short build fixture. It reads no personal files and stores no changes.</p>
    </section>
    ${terminalRecording(true)}
    <section class="demo-explainer" aria-labelledby="demo-details-heading">
      <h2 id="demo-details-heading">What the adapter removed</h2>
      <dl><div><dt>3</dt><dd>rewritten progress frames</dd></div><div><dt>2</dt><dd>ANSI color sequences</dd></div><div><dt>1</dt><dd>link exposed as its own record</dd></div></dl>
      <p>Run the same fixture locally with <code>cargo run -- demo</code>. The command prints the temporary transcript path.</p>
    </section>
  </main>`, true);
}

function privacyPage(): string {
  return shell(`<main id="main" tabindex="-1" class="text-page">
    <p class="eyebrow">Policy · updated 28 August 2026</p>
    <h1>Your command output stays with you</h1>
    <h2>The CLI</h2><p>tsrm processes command output in local memory. It has no network code, account, analytics, or background service.</p><p>A transcript file is created only when you pass <code>--output</code>. You choose its location and can delete it at any time.</p>
    <h2>The docs site</h2><p>This site has no analytics, cookies, forms, or third-party scripts. Its service worker caches public site files for offline reading.</p><p>Resetting the demo changes only the page in memory. Closing or reloading the page clears that state.</p>
    <h2>Questions</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a privacy question.</p>
  </main>`);
}

function termsPage(): string {
  return shell(`<main id="main" tabindex="-1" class="text-page">
    <p class="eyebrow">Terms · updated 28 August 2026</p>
    <h1>Use the tool at your own pace</h1>
    <h2>License</h2><p>The CLI and site source are provided under the MIT License. The repository includes the full license text.</p>
    <h2>No warranty</h2><p>The software is provided “as is,” without warranty. Check important command output before acting on it.</p>
    <h2>Acceptable use</h2><p>Use the tool only with commands and output you are allowed to access.</p>
    <h2>Questions</h2><p>Email <a href="mailto:legal@sociobot.in">legal@sociobot.in</a> with a terms question.</p>
  </main>`);
}

function notFoundPage(): string {
  return shell(`<main id="main" tabindex="-1" class="not-found">
    <p class="error-code" aria-hidden="true">4 ▒ 4</p><p class="eyebrow">Path not found</p>
    <h1>This transcript has no matching line</h1><p>The address may have changed. Return to the product page or open the sample.</p>
    <div class="not-found-actions"><a class="button primary" href="/" data-route>Return home</a><a class="button secondary" href="/demo" data-route>Open the demo</a></div>
  </main>`);
}

function currentPath(): string {
  const path = location.pathname.replace(/\/$/, "") || "/";
  return titleByPath[path] ? path : "/404";
}

function render(announce = false): void {
  const path = currentPath();
  document.title = titleByPath[path];
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `${origin}${path === "/404" ? location.pathname : path}`;
  app.innerHTML = path === "/" ? homePage() : path === "/demo" ? demoPage() : path === "/privacy" ? privacyPage() : path === "/terms" ? termsPage() : notFoundPage();
  bindActions();
  updateNetworkState();
  if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
  if (announce) {
    const heading = document.querySelector<HTMLHeadingElement>("h1")!;
    heading.tabIndex = -1;
    heading.focus();
    document.querySelector<HTMLElement>(".route-status")!.textContent = heading.textContent;
  }
}

let playbackTimer: number | undefined;
function revealRecording(recording: HTMLElement): void {
  clearInterval(playbackTimer);
  const lines = [...recording.querySelectorAll<HTMLElement>(".terminal-line")];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lines.forEach((line) => line.classList.add("is-visible"));
    recording.querySelector<HTMLElement>(".empty-output")!.hidden = true;
    return;
  }
  lines.forEach((line) => line.classList.remove("is-visible"));
  recording.querySelector<HTMLElement>(".empty-output")!.hidden = true;
  let index = 0;
  const showNext = () => {
    lines[index]?.classList.add("is-visible");
    index += 1;
    if (index >= lines.length) clearInterval(playbackTimer);
  };
  showNext();
  playbackTimer = window.setInterval(showNext, 700);
}

function clearRecording(recording: HTMLElement): void {
  clearInterval(playbackTimer);
  recording.querySelectorAll(".terminal-line").forEach((line) => line.classList.remove("is-visible"));
  recording.querySelector<HTMLElement>(".empty-output")!.hidden = false;
}

function bindActions(): void {
  document.querySelectorAll<HTMLAnchorElement>("a[data-route]").forEach((link) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || link.target) return;
    const target = new URL(link.href);
    if (target.origin !== location.origin) return;
    event.preventDefault();
    history.replaceState({ scrollY: scrollY }, "");
    history.pushState({ scrollY: 0 }, "", `${target.pathname}${target.hash}`);
    scrollTo(0, 0);
    render(true);
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const recording = button.closest("main, section, body")?.querySelector<HTMLElement>("[data-recording]") ?? document.querySelector<HTMLElement>("[data-recording]");
    if (button.dataset.action === "play" && recording) revealRecording(recording);
    if (button.dataset.action === "pause") clearInterval(playbackTimer);
    if (button.dataset.action === "reset-output" && recording) clearRecording(recording);
    if (button.dataset.action === "reset-demo") {
      const demoRecording = document.querySelector<HTMLElement>("[data-recording]");
      if (demoRecording) clearRecording(demoRecording);
      const heading = document.querySelector<HTMLHeadingElement>("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    const status = document.querySelector<HTMLElement>(".copy-status")!;
    try {
      await navigator.clipboard.writeText(button.dataset.copy!);
      status.textContent = "Install command copied.";
    } catch {
      status.textContent = "The command was not copied. Select the command text and copy it.";
    }
  }));
}

function updateNetworkState(): void {
  const note = document.querySelector<HTMLElement>(".offline-note");
  if (note) note.hidden = navigator.onLine;
}

history.scrollRestoration = "manual";
addEventListener("popstate", (event) => {
  render(true);
  requestAnimationFrame(() => scrollTo(0, event.state?.scrollY ?? 0));
});
addEventListener("online", updateNetworkState);
addEventListener("offline", updateNetworkState);
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
