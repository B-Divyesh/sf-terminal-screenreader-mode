# Visual thesis: signal recovered from terminal noise

## Direction

Terminal Screenreader Mode uses a restrained pixel/demoscene language. The page begins in a dense field of terminal noise, then resolves into evenly spaced transcript rows. That visual change mirrors the CLI's real job: replace volatile character-cell painting with calm, linear speech input. It must feel like a focused accessibility utility, not a nostalgic game or a generic developer landing page.

The treatment is intentionally dark-only. Terminal black is the working surface, phosphor mint marks stable output, amber marks changing output, and paper-white carries long text. Color always has a written label or structural cue.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--void` | `#090c0f` | page background |
| `--panel` | `#111820` | terminal and grouped surfaces |
| `--panel-raised` | `#18232d` | controls and elevated strips |
| `--ink` | `#f2f5e9` | primary text |
| `--muted` | `#b7c3bd` | supporting text; 8.9:1 on void |
| `--signal` | `#6fffb0` | focus, stable output, success |
| `--signal-ink` | `#07130c` | text on signal |
| `--amber` | `#ffc85a` | rewrites, warnings |
| `--danger` | `#ff7b7b` | command errors |
| `--grid` | `#26353e` | borders and pixel grid |

## Type

- Display and terminal: `ui-monospace, "Cascadia Mono", "SFMono-Regular", Consolas, monospace`. Square letterforms carry the terminal setting without a font download.
- Body: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Familiar forms make instructions easy to scan.
- No runtime font files or third-party font requests.
- The type scale is 16, 18, 24, 38, and 64 px. Body line height is 1.6 and prose stays under 68 characters.

## Spacing and shape

- An 8 px base rhythm: 8, 16, 24, 32, 48, 64, 96.
- Layout follows an offset terminal grid. Copy uses the left two-fifths; the recovered transcript crosses the wider right field.
- Corners use 0 or 2 px radii. Pixel-notched borders and one-cell shadows replace soft cards.
- Controls are at least 44 px high. Focus uses a 3 px mint outline with a 3 px void offset.

## Art and assets

- Hero image: an original, generated pixel-art scene of amber terminal noise resolving into ordered mint transcript bands. It contains no readable text. The site places real HTML labels beside it.
- The landing terminal recording is generated from the real `tsrm demo` output and stored as a static SVG with a text transcript beside it.
- The favicon and wordmark glyph are original hand-made SVGs based on a carriage-return arrow entering three stable rows.
- Open Graph art is composed locally from the generated hero and HTML-free product framing.

### Generation provenance

The hero is generated during this work order with `/opt/fleet/lib/gen-image.sh`, deployment `factory-image`, then locally cropped and converted to WebP. Prompt: “Wide editorial pixel-art illustration for an accessibility command-line utility. On the left, dense amber terminal glyph fragments and spinner arcs collide and overwrite one another. Across the center, the noise passes through a small dark adapter gate. On the right, it resolves into calm horizontal mint-green transcript rows with clear spacing. Authentic 1990s demoscene pixel clusters, one-bit dither texture, deep near-black background, high contrast, restrained palette #090c0f #6fffb0 #ffc85a #f2f5e9. No readable words, no logos, no gradients, no glass effects, no people, no watermark. Wide 3:2 composition with the subject spanning the frame and quiet margins.”

Generated image output is project-owned under the factory asset license. Hand-made SVG assets are MIT with the repository.

## Interaction grammar

- The primary action advances by one pixel-cell shadow on hover and returns on press.
- Terminal demo controls resemble physical function keys, but keep native button semantics.
- Route changes move focus to the page heading and announce it. The demo output is static until the user selects “Play recording.”
- Copy buttons announce the result in a polite live region.

## Motion policy

One signature motion shows noisy amber rows collapsing into a single mint transcript line during the terminal recording. Playback is user-started, lasts under six seconds, and can be paused or reset. Nothing auto-plays or loops. With `prefers-reduced-motion: reduce`, every row appears immediately and all transforms and transitions are disabled.

## Responsive intent

At 390 px, artwork moves below the first action, navigation collapses to two essential links, code samples scroll inside their own region, and the terminal recording shows the final stable state. No information or action is hidden.
