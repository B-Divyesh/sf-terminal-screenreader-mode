use serde::Serialize;
use std::collections::BTreeSet;

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Text,
    Heading,
    Error,
    Link,
    Status,
}

impl Kind {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::Heading => "heading",
            Self::Error => "error",
            Self::Link => "link",
            Self::Status => "status",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct Record {
    pub kind: Kind,
    pub text: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum EscapeState {
    Text,
    Escape,
    Csi,
    Osc,
    OscEscape,
}

/// Converts volatile terminal bytes into complete, stable records.
///
/// Feed arbitrary chunks with [`Normalizer::feed`], then call
/// [`Normalizer::finish`] once at end of input.
pub struct Normalizer {
    line: Vec<u8>,
    state: EscapeState,
    osc: Vec<u8>,
    osc_links: Vec<String>,
    last_text: Option<String>,
}

impl Default for Normalizer {
    fn default() -> Self {
        Self {
            line: Vec::new(),
            state: EscapeState::Text,
            osc: Vec::new(),
            osc_links: Vec::new(),
            last_text: None,
        }
    }
}

impl Normalizer {
    pub fn feed(&mut self, input: &[u8]) -> Vec<Record> {
        let mut records = Vec::new();
        for &byte in input {
            match self.state {
                EscapeState::Text => match byte {
                    0x1b => self.state = EscapeState::Escape,
                    b'\r' => {
                        self.line.clear();
                        self.osc_links.clear();
                    }
                    b'\n' => records.extend(self.take_line()),
                    0x08 => {
                        self.line.pop();
                    }
                    0x00..=0x08 | 0x0b..=0x1a | 0x1c..=0x1f | 0x7f => {}
                    _ => self.line.push(byte),
                },
                EscapeState::Escape => {
                    self.state = match byte {
                        b'[' => EscapeState::Csi,
                        b']' => {
                            self.osc.clear();
                            EscapeState::Osc
                        }
                        _ => EscapeState::Text,
                    };
                }
                EscapeState::Csi => {
                    if (0x40..=0x7e).contains(&byte) {
                        self.state = EscapeState::Text;
                    }
                }
                EscapeState::Osc => match byte {
                    0x07 => {
                        self.capture_osc_link();
                        self.state = EscapeState::Text;
                    }
                    0x1b => self.state = EscapeState::OscEscape,
                    _ => self.osc.push(byte),
                },
                EscapeState::OscEscape => {
                    if byte == b'\\' {
                        self.capture_osc_link();
                        self.state = EscapeState::Text;
                    } else {
                        self.osc.push(0x1b);
                        self.osc.push(byte);
                        self.state = EscapeState::Osc;
                    }
                }
            }
        }
        records
    }

    pub fn finish(&mut self) -> Vec<Record> {
        self.take_line()
    }

    fn capture_osc_link(&mut self) {
        let payload = String::from_utf8_lossy(&self.osc);
        if let Some(url) = payload.strip_prefix("8;;") {
            if !url.is_empty() {
                self.osc_links.push(url.to_owned());
            }
        }
        self.osc.clear();
    }

    fn take_line(&mut self) -> Vec<Record> {
        let raw = String::from_utf8_lossy(&self.line).into_owned();
        self.line.clear();
        let Some(text) = clean_line(&raw) else {
            self.osc_links.clear();
            return Vec::new();
        };
        if self.last_text.as_deref() == Some(text.as_str()) {
            self.osc_links.clear();
            return Vec::new();
        }
        self.last_text = Some(text.clone());

        let mut records = vec![Record {
            kind: classify(&text),
            text: heading_text(text),
        }];
        let mut links: BTreeSet<String> = extract_links(&raw).into_iter().collect();
        links.extend(self.osc_links.drain(..));
        records.extend(links.into_iter().map(|text| Record {
            kind: Kind::Link,
            text,
        }));
        records
    }
}

fn clean_line(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let spinner_chars = "|/-\\⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
    if trimmed.chars().all(|c| spinner_chars.contains(c)) {
        return None;
    }
    let mut chars = trimmed.chars();
    if let (Some(first), Some(second)) = (chars.next(), chars.next()) {
        if spinner_chars.contains(first) && second.is_whitespace() {
            let without_spinner = trimmed[first.len_utf8()..].trim_start();
            return (!without_spinner.is_empty()).then(|| without_spinner.to_owned());
        }
    }
    Some(trimmed.to_owned())
}

fn classify(text: &str) -> Kind {
    let lower = text.to_ascii_lowercase();
    if lower.starts_with("error")
        || lower.starts_with("failed")
        || lower.starts_with("fatal")
        || lower.starts_with("panic")
    {
        Kind::Error
    } else if text.starts_with('#')
        || (text.ends_with(':') && text.len() < 80 && !text.contains("http"))
    {
        Kind::Heading
    } else {
        Kind::Text
    }
}

fn heading_text(text: String) -> String {
    if text.starts_with('#') {
        text.trim_start_matches('#').trim_start().to_owned()
    } else {
        text
    }
}

fn extract_links(text: &str) -> Vec<String> {
    let mut links = Vec::new();
    let mut rest = text;
    while let Some(start) = rest.find("https://").or_else(|| rest.find("http://")) {
        let candidate = &rest[start..];
        let end = candidate
            .find(|c: char| c.is_whitespace() || matches!(c, ')' | ']' | '}' | '>' | '"' | '\''))
            .unwrap_or(candidate.len());
        let link = candidate[..end]
            .trim_end_matches([',', '.', ';', ':', '!', '?'])
            .to_owned();
        if !link.is_empty() {
            links.push(link);
        }
        rest = &candidate[end..];
    }
    links
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_only_the_final_rewritten_line() {
        let mut normalizer = Normalizer::default();
        let records = normalizer.feed(b"| loading\r/ loading\rDone\n");
        assert_eq!(
            records,
            vec![Record {
                kind: Kind::Text,
                text: "Done".into()
            }]
        );
    }

    #[test]
    fn strips_ansi_and_preserves_unicode() {
        let mut normalizer = Normalizer::default();
        let records = normalizer.feed("\x1b[32m完成 ✓\x1b[0m\n".as_bytes());
        assert_eq!(records[0].text, "完成 ✓");
    }

    #[test]
    fn labels_headings_errors_and_links() {
        let mut normalizer = Normalizer::default();
        let records = normalizer.feed(b"## Results\nError: failed\nSee https://example.test/a.\n");
        assert_eq!(records[0].kind, Kind::Heading);
        assert_eq!(records[0].text, "Results");
        assert_eq!(records[1].kind, Kind::Error);
        assert_eq!(
            records[3],
            Record {
                kind: Kind::Link,
                text: "https://example.test/a".into()
            }
        );
    }

    #[test]
    fn exposes_osc_eight_links() {
        let mut normalizer = Normalizer::default();
        let records = normalizer.feed(b"\x1b]8;;https://example.test\x1b\\report\x1b]8;;\x1b\\\n");
        assert_eq!(records[1].kind, Kind::Link);
        assert_eq!(records[1].text, "https://example.test");
    }

    #[test]
    fn accepts_chunks_in_the_middle_of_escape_sequences() {
        let mut normalizer = Normalizer::default();
        assert!(normalizer.feed(b"\x1b[3").is_empty());
        let records = normalizer.feed(b"1mgreen\x1b[0m\n");
        assert_eq!(records[0].text, "green");
    }
}
