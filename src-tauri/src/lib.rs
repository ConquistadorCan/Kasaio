use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use std::sync::Mutex;
use tauri::State;

pub struct ApiPort(pub Mutex<u16>);

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
        .invoke_handler(tauri::generate_handler![get_api_port])
        .setup(|app| {
            eprintln!("[kasaio] setup started");

            let shell = app.shell();
            eprintln!("[kasaio] got shell");

            let sidecar_result = shell.sidecar("python-sidecar");
            eprintln!("[kasaio] sidecar result: {:?}", sidecar_result.is_ok());

            let (mut rx, _child) = sidecar_result
                .expect("sidecar not found")
                .spawn()
                .expect("failed to spawn sidecar");

            eprintln!("[kasaio] sidecar spawned");

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}