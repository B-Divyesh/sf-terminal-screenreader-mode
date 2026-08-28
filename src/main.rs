use chrono::Utc;
use clap::{Args, Parser, Subcommand};
use serde::Serialize;
use std::ffi::OsString;
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::process::{Command, ExitCode, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use terminal_screenreader_mode::{Kind, Normalizer, Record};

#[derive(Parser)]
#[command(
    name = "tsrm",
    version,
    about = "Turn changing terminal output into a stable transcript"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Wrap a command and print its stable transcript
    Run(RunArgs),
    /// Normalize terminal bytes read from standard input
    Normalize(OutputArgs),
    /// Run bundled noisy output in an isolated temporary directory
    Demo(OutputArgs),
}

#[derive(Args, Clone)]
struct OutputArgs {
    /// Emit one JSON object per record
    #[arg(long)]
    json: bool,
    /// Omit UTC timestamps
    #[arg(long)]
    no_timestamps: bool,
    /// Play a terminal bell before headings and errors
    #[arg(long)]
    earcons: bool,
    /// Also save the transcript to this file
    #[arg(short, long, value_name = "FILE")]
    output: Option<PathBuf>,
}

#[derive(Args)]
struct RunArgs {
    #[command(flatten)]
    output_args: OutputArgs,
    /// Command and arguments to run; place them after --
    #[arg(required = true, trailing_var_arg = true, allow_hyphen_values = true)]
    command: Vec<OsString>,
}

struct TranscriptWriter {
    options: OutputArgs,
    file: Option<File>,
    count: usize,
}

#[derive(Serialize)]
struct JsonRecord<'a> {
    #[serde(skip_serializing_if = "Option::is_none")]
    timestamp: Option<String>,
    kind: &'a str,
    text: &'a str,
}

impl TranscriptWriter {
    fn new(options: OutputArgs) -> io::Result<Self> {
        let file = options.output.as_ref().map(File::create).transpose()?;
        Ok(Self {
            options,
            file,
            count: 0,
        })
    }

    fn emit(&mut self, record: &Record) -> io::Result<()> {
        let timestamp =
            (!self.options.no_timestamps).then(|| Utc::now().format("%H:%M:%SZ").to_string());
        let mut line = if self.options.json {
            serde_json::to_string(&JsonRecord {
                timestamp,
                kind: record.kind.label(),
                text: &record.text,
            })
            .expect("record serialization cannot fail")
        } else if let Some(timestamp) = timestamp {
            format!("{timestamp} | {:<7} | {}", record.kind.label(), record.text)
        } else {
            format!("{:<7} | {}", record.kind.label(), record.text)
        };
        line.push('\n');
        if self.options.earcons && matches!(record.kind, Kind::Heading | Kind::Error) {
            line.insert(0, '\x07');
        }
        let mut stdout = io::stdout().lock();
        stdout.write_all(line.as_bytes())?;
        stdout.flush()?;
        if let Some(file) = &mut self.file {
            file.write_all(line.as_bytes())?;
            file.flush()?;
        }
        self.count += 1;
        Ok(())
    }

    fn emit_many(&mut self, records: Vec<Record>) -> io::Result<()> {
        for record in &records {
            self.emit(record)?;
        }
        Ok(())
    }
}

fn main() -> ExitCode {
    match run_cli(Cli::parse()) {
        Ok(code) => ExitCode::from(code.clamp(0, 255) as u8),
        Err(error) => {
            eprintln!("tsrm: {error}");
            ExitCode::from(2)
        }
    }
}

fn run_cli(cli: Cli) -> Result<i32, Box<dyn std::error::Error>> {
    match cli.command {
        Commands::Run(args) => run_command(args),
        Commands::Normalize(options) => {
            let mut input = Vec::new();
            io::stdin().read_to_end(&mut input)?;
            normalize_bytes(&input, options)?;
            Ok(0)
        }
        Commands::Demo(mut options) => {
            let dir = demo_directory()?;
            let output = dir.join("transcript.txt");
            options.output = Some(output.clone());
            let bytes = expand_demo(include_str!("../examples/noisy-build.events"));
            normalize_bytes(&bytes, options)?;
            eprintln!("Demo transcript: {}", output.display());
            Ok(0)
        }
    }
}

fn normalize_bytes(bytes: &[u8], options: OutputArgs) -> io::Result<usize> {
    let mut writer = TranscriptWriter::new(options)?;
    let mut normalizer = Normalizer::default();
    writer.emit_many(normalizer.feed(bytes))?;
    writer.emit_many(normalizer.finish())?;
    Ok(writer.count)
}

fn run_command(args: RunArgs) -> Result<i32, Box<dyn std::error::Error>> {
    let executable = args.command.first().ok_or("no command supplied")?;
    let mut child = Command::new(executable)
        .args(&args.command[1..])
        .stdin(Stdio::inherit())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("could not start command: {error}"))?;

    let stdout = child.stdout.take().expect("piped stdout");
    let stderr = child.stderr.take().expect("piped stderr");
    let (sender, receiver) = mpsc::channel::<Option<Vec<u8>>>();
    for mut stream in [Box::new(stdout) as Box<dyn Read + Send>, Box::new(stderr)] {
        let sender = sender.clone();
        thread::spawn(move || {
            let mut buffer = [0_u8; 4096];
            loop {
                match stream.read(&mut buffer) {
                    Ok(0) | Err(_) => break,
                    Ok(length) => {
                        if sender.send(Some(buffer[..length].to_vec())).is_err() {
                            return;
                        }
                    }
                }
            }
            let _ = sender.send(None);
        });
    }
    drop(sender);

    let mut writer = TranscriptWriter::new(args.output_args)?;
    let mut normalizer = Normalizer::default();
    let mut finished_streams = 0;
    while finished_streams < 2 {
        match receiver.recv()? {
            Some(bytes) => writer.emit_many(normalizer.feed(&bytes))?,
            None => finished_streams += 1,
        }
    }
    writer.emit_many(normalizer.finish())?;
    let status = child.wait()?;
    if writer.count == 0 {
        writer.emit(&Record {
            kind: Kind::Status,
            text: "Command finished without output".to_owned(),
        })?;
    }
    Ok(status.code().unwrap_or(1))
}

fn demo_directory() -> io::Result<PathBuf> {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("tsrm-demo-{}-{nonce}", std::process::id()));
    fs::create_dir(&path)?;
    Ok(path)
}

fn expand_demo(source: &str) -> Vec<u8> {
    let mut bytes = Vec::new();
    for line in source
        .lines()
        .filter(|line| !line.starts_with('#') && !line.is_empty())
    {
        let (kind, value) = line.split_once('\t').unwrap_or(("LINE", line));
        let value = value.replace("\\e", "\x1b");
        bytes.extend_from_slice(value.as_bytes());
        bytes.push(if kind == "REWRITE" { b'\r' } else { b'\n' });
    }
    bytes
}
