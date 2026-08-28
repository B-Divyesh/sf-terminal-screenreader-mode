use std::fs;
use std::io::{BufRead, Read};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

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

#[test]
fn run_releases_a_complete_line_before_a_quiet_child_writes_again() {
    let started = Instant::now();
    let mut child = Command::new(binary())
        .args([
            "run",
            "--no-timestamps",
            "--",
            "sh",
            "-c",
            "printf 'phase one\\n'; sleep 1; printf 'phase two\\n'",
        ])
        .stdout(Stdio::piped())
        .spawn()
        .expect("wrapper starts");
    let mut first = String::new();
    let mut transcript = std::io::BufReader::new(child.stdout.take().expect("piped stdout"));
    transcript
        .read_line(&mut first)
        .expect("first transcript line is readable");
    assert_eq!(first, "text    | phase one\n");
    assert!(
        started.elapsed() < Duration::from_millis(700),
        "first complete line was held for too long: {:?}",
        started.elapsed()
    );
    let mut remaining = String::new();
    transcript
        .read_to_string(&mut remaining)
        .expect("remaining transcript is readable");
    assert!(remaining.contains("text    | phase two"));
    assert!(child.wait().expect("wrapper exits").success());
}

#[test]
fn run_preserves_alternating_stdout_stderr_write_order() {
    let expected = ["stdout-1", "stderr-1", "stdout-2", "stderr-2"];
    for attempt in 1..=100 {
        let output = Command::new(binary())
            .args([
                "run",
                "--no-timestamps",
                "--",
                "sh",
                "-c",
                "printf 'stdout-1\\n'; printf 'stderr-1\\n' >&2; printf 'stdout-2\\n'; printf 'stderr-2\\n' >&2",
            ])
            .output()
            .expect("wrapper runs");
        assert!(output.status.success());
        let transcript = String::from_utf8(output.stdout).expect("transcript is UTF-8");
        let records = transcript
            .lines()
            .map(|line| line.split_once(" | ").expect("label separator").1)
            .collect::<Vec<_>>();
        assert_eq!(records, expected, "ordering changed on attempt {attempt}");
    }
}

#[cfg(unix)]
#[test]
fn run_produces_the_same_linear_output_in_common_shells() {
    for shell in ["/bin/bash", "/bin/dash"] {
        if !std::path::Path::new(shell).exists() {
            continue;
        }
        let output = Command::new(shell)
            .args([
                "-c",
                &format!(
                    "\"{}\" run --no-timestamps -- sh -c \
                     'printf \"\\033[32mready\\033[0m\\n\"; printf \"Error: failed\\n\" >&2'",
                    binary()
                ),
            ])
            .output()
            .expect("shell starts");
        assert!(output.status.success(), "{shell} failed");
        assert_eq!(
            String::from_utf8(output.stdout).expect("UTF-8 transcript"),
            "text    | ready\nerror   | Error: failed\n",
            "unexpected transcript in {shell}"
        );
    }
}
