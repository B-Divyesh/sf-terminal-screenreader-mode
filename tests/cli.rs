use std::fs;
use std::process::{Command, Stdio};

fn binary() -> &'static str {
    env!("CARGO_BIN_EXE_tsrm")
}

#[test]
fn demo_creates_an_isolated_transcript() {
    let output = Command::new(binary())
        .args(["demo", "--no-timestamps"])
        .output()
        .expect("demo runs");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("heading | Build results"));
    assert!(stdout.contains("link    | https://example.test/build/42"));
    assert!(!stdout.contains("Resolving 2"));
    assert!(!stdout.contains("\x1b["));
    let stderr = String::from_utf8(output.stderr).unwrap();
    let path = stderr.trim().strip_prefix("Demo transcript: ").unwrap();
    assert_eq!(fs::read_to_string(path).unwrap(), stdout);
}

#[test]
fn normalize_supports_json_lines() {
    let mut child = Command::new(binary())
        .args(["normalize", "--json", "--no-timestamps"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    use std::io::Write;
    child
        .stdin
        .take()
        .unwrap()
        .write_all(b"## Result\n")
        .unwrap();
    let output = child.wait_with_output().unwrap();
    assert_eq!(
        String::from_utf8(output.stdout).unwrap(),
        "{\"kind\":\"heading\",\"text\":\"Result\"}\n"
    );
}

#[test]
fn run_returns_the_wrapped_exit_code() {
    let status = Command::new(binary())
        .args(["run", "--no-timestamps", "--", "sh", "-c", "exit 7"])
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(7));
}
