use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandEvent, CommandChild};
use std::sync::Mutex;
use tauri::State;

pub struct ApiPort(pub Mutex<u16>);

/// Holds the sidecar process handle so it stays alive for the entire app lifetime
/// and can be explicitly killed on exit.
pub struct SidecarHandle(pub Mutex<Option<CommandChild>>);

#[tauri::command]
fn get_api_port(state: State<ApiPort>) -> u16 {
    *state.0.lock().unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    eprintln!("[kasaio] run() started");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ApiPort(Mutex::new(0)))
        .manage(SidecarHandle(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_api_port])
        .setup(|app| {
            eprintln!("[kasaio] setup started");

            let shell = app.shell();
            eprintln!("[kasaio] got shell");

            let sidecar_result = shell.sidecar("python-sidecar");
            eprintln!("[kasaio] sidecar result: {:?}", sidecar_result.is_ok());

            let (mut rx, child) = sidecar_result
                .expect("sidecar not found")
                .spawn()
                .expect("failed to spawn sidecar");

            eprintln!("[kasaio] sidecar spawned");

            // Store the child handle in managed state so it is kept alive
            // and can be killed when the app exits.
            *app.state::<SidecarHandle>().0.lock().unwrap() = Some(child);

            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                eprintln!("[kasaio] async task started");
                while let Some(event) = rx.recv().await {
                    match &event {
                        CommandEvent::Stdout(line) => {
                            let text = String::from_utf8_lossy(line);
                            eprintln!("[kasaio] stdout: {}", text);
                            if let Some(port_str) = text.trim().strip_prefix("KASAIO_API_PORT=") {
                                if let Ok(port) = port_str.trim().parse::<u16>() {
                                    eprintln!("[kasaio] port found: {}", port);
                                    *handle.state::<ApiPort>().0.lock().unwrap() = port;
                                }
                            }
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[kasaio] stderr: {}", String::from_utf8_lossy(line));
                        }
                        CommandEvent::Error(e) => {
                            eprintln!("[kasaio] error: {}", e);
                        }
                        CommandEvent::Terminated(status) => {
                            eprintln!("[kasaio] terminated: {:?}", status);
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill the sidecar when the last window is destroyed.
            if let tauri::WindowEvent::Destroyed = event {
                let app = window.app_handle();
                if app.webview_windows().is_empty() {
                    if let Some(child) = app.state::<SidecarHandle>().0.lock().unwrap().take() {
                        let _ = child.kill();
                        eprintln!("[kasaio] sidecar killed on exit");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}