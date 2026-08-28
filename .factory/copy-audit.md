# Landing copy audit

Audited 28 August 2026 against the `plain-words` skill. Counts treat a command, version, or URL as one word. No line exceeds 22 words. No line contains a banned word.

## First screen

| Copy | Words | Result |
| --- | ---: | --- |
| Local CLI adapter · v0.1.0 | 4 | Pass |
| Read streaming commands without losing your place | 7 | Pass |
| For screen-reader users, tsrm turns changing terminal output into stable lines you can revisit. | 14 | Pass |
| Try it with sample data | 5 | Pass |
| See a noisy build become six stable lines. | 8 | Pass |
| Runs on your device | 4 | Pass |
| Saves nothing by default | 4 | Pass |
| Free under MIT | 3 | Pass |

## Product preview

| Copy | Words | Result |
| --- | ---: | --- |
| Hear the final line, not every spinner frame | 8 | Pass |
| Play recording | 2 | Pass |
| Pause | 1 | Pass |
| Clear output | 2 | Pass |
| Local / 6 lines | 4 | Pass |
| Starting accessible build | 3 | Pass |
| Build results | 2 | Pass |
| 18 checks passed | 3 | Pass |
| Report: https://example.test/build/42 | 2 | Pass |
| Finished without errors | 3 | Pass |
| The recording uses the bundled sample processed by the real CLI. | 11 | Pass |
| Its controls work with a keyboard. | 6 | Pass |

## How it works

| Copy | Words | Result |
| --- | ---: | --- |
| How it works | 3 | Pass |
| Wrap your command | 3 | Pass |
| Place `tsrm run --` before the command you already use. | 10 | Pass |
| Replace volatile rows | 3 | Pass |
| ANSI controls disappear. | 3 | Pass |
| Carriage returns replace the pending row. | 6 | Pass |
| Read stable records | 3 | Pass |
| Headings, errors, and links receive plain labels in the transcript. | 10 | Pass |

## Install and boundaries

| Copy | Words | Result |
| --- | ---: | --- |
| Install the local CLI | 4 | Pass |
| Build with Rust 1.85 or newer. | 6 | Pass |
| No account or service key is needed. | 7 | Pass |
| Read the source on GitHub | 5 | Pass |
| Copy install command | 3 | Pass |
| What stays outside the tool | 5 | Pass |
| tsrm does not speak, emulate a terminal, or send output to a server. | 13 | Pass |
| Full-screen interactive apps may not produce a useful linear transcript. | 10 | Pass |
| Use their own accessibility mode when available. | 7 | Pass |
| Compatibility pilots with NVDA, JAWS, and VoiceOver are the next release gate. | 12 | Pass |
| Stable terminal output for screen-reader users. | 6 | Pass |

## Conditional feedback

| Copy | Words | Result |
| --- | ---: | --- |
| Install command copied. | 3 | Pass |
| The command was not copied. | 5 | Pass |
| Select the command text and copy it. | 8 | Pass |
| Docs are offline. | 3 | Pass |
| This saved page and the local CLI remain available. | 10 | Pass |

## Terminology

| Concept | One term |
| --- | --- |
| Executable and product in commands | `tsrm` |
| Full normalized output | transcript |
| One human-readable transcript unit | line |
| One JSON Lines object or typed output unit | record |
| Volatile carriage-return update | rewritten row |
| Optional sound cue | earcon |
| Try-out state | demo |

## First-screen read-aloud check

“Read streaming commands without losing your place. For screen-reader users, tsrm turns changing terminal output into stable lines you can revisit. Try it with sample data.”

The job, audience, change, and next action fit in one short read.
