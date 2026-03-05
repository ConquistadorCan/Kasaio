use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::sync::Mutex;
use tauri::State;

pub struct ApiPort(pub Mutex<u16>);

#[tauri::command]
fn get_api_port(state: State<ApiPort>) -> u16 {
    *state.0.lock().unwrap()
}

fn spawn_backend() -> u16 {
    let cwd = std::env::current_dir().expect("Failed to get cwd");
    eprintln!("[kasaio] CWD: {:?}", cwd);

    let python = if cfg!(target_os = "windows") {
        "..\\src-backend\\venv\\Scripts\\python.exe"
    } else {
        "../src-backend/venv/bin/python"
    };

    eprintln!("[kasaio] Spawning: {} ..\\src-backend\\main.py", python);

    let mut child = Command::new(python)
        .arg("..\\src-backend\\main.py")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .expect("Failed to start backend process");

    let stdout = child.stdout.take().expect("Failed to capture stdout");
    let reader = BufReader::new(stdout);

    for line in reader.lines() {
        let line = line.expect("Failed to read line");
        eprintln!("[kasaio] backend stdout: {}", line);
        if let Some(port_str) = line.strip_prefix("KASAIO_API_PORT=") {
            let port: u16 = port_str.trim().parse().expect("Invalid port number");
            eprintln!("[kasaio] Port found: {}", port);
            std::mem::forget(child);
            return port;
        }
    }

    panic!("Backend did not print KASAIO_API_PORT");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = spawn_backend();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ApiPort(Mutex::new(port)))
        .invoke_handler(tauri::generate_handler![get_api_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}