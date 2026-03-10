use std::sync::Mutex;
use tauri::{Manager, State};

pub struct ApiPort(pub Mutex<u16>);

#[tauri::command]
fn get_api_port(state: State<ApiPort>) -> u16 {
    *state.0.lock().unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ApiPort(Mutex::new(0)))
        .setup(setup)
        .on_window_event(on_window_event)
        .invoke_handler(tauri::generate_handler![get_api_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(debug_assertions)]
    dev::spawn(app)?;

    #[cfg(not(debug_assertions))]
    release::spawn(app)?;

    Ok(())
}

fn on_window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if let tauri::WindowEvent::Destroyed = event {
        let app = window.app_handle();
        if app.webview_windows().is_empty() {
            #[cfg(debug_assertions)]
            dev::kill(app);

            #[cfg(not(debug_assertions))]
            release::kill(app);
        }
    }
}

// ---------------------------------------------------------------------------
// Dev mode — spawns venv Python directly so sys.frozen is False
// ---------------------------------------------------------------------------
#[cfg(debug_assertions)]
mod dev {
    use super::ApiPort;
    use std::io::{BufRead, BufReader};
    use std::sync::Mutex;
    use tauri::Manager;

    pub struct Child(pub Mutex<Option<std::process::Child>>);

    pub fn spawn(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
        app.manage(Child(Mutex::new(None)));

        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let backend_dir = std::path::Path::new(manifest_dir)
            .parent()
            .expect("workspace root not found")
            .join("src-backend");

        let python_exe = backend_dir.join("venv").join("Scripts").join("python.exe");
        let main_py = backend_dir.join("main.py");

        let mut child = std::process::Command::new(&python_exe)
            .arg(&main_py)
            .current_dir(&backend_dir)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()?;

        let stderr = child.stderr.take().unwrap();
        std::thread::spawn(move || {
            BufReader::new(stderr)
                .lines()
                .flatten()
                .for_each(|l| eprintln!("[kasaio:dev] {}", l));
        });

        let stdout = child.stdout.take().unwrap();
        let handle = app.handle().clone();
        std::thread::spawn(move || {
            for line in BufReader::new(stdout).lines().flatten() {
                if let Some(port_str) = line.trim().strip_prefix("KASAIO_API_PORT=") {
                    if let Ok(port) = port_str.trim().parse::<u16>() {
                        *handle.state::<ApiPort>().0.lock().unwrap() = port;
                    }
                }
            }
        });

        *app.state::<Child>().0.lock().unwrap() = Some(child);
        Ok(())
    }

    pub fn kill(app: &tauri::AppHandle) {
        if let Some(mut child) = app.state::<Child>().0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}

// ---------------------------------------------------------------------------
// Release mode — uses the bundled PyInstaller sidecar
// ---------------------------------------------------------------------------
#[cfg(not(debug_assertions))]
mod release {
    use super::ApiPort;
    use std::sync::Mutex;
    use tauri::Manager;
    use tauri_plugin_shell::{
        process::{CommandChild, CommandEvent},
        ShellExt,
    };

    pub struct Sidecar(pub Mutex<Option<CommandChild>>);

    pub fn spawn(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
        app.manage(Sidecar(Mutex::new(None)));

        let data_dir = app.path().app_data_dir()?;
        std::fs::create_dir_all(&data_dir)?;

        let (mut rx, child) = app.shell()
            .sidecar("python-sidecar")?
            .env("KASAIO_DATA_DIR", data_dir.to_string_lossy().as_ref())
            .spawn()?;
        *app.state::<Sidecar>().0.lock().unwrap() = Some(child);

        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(line) => {
                        let text = String::from_utf8_lossy(&line);
                        if let Some(port_str) = text.trim().strip_prefix("KASAIO_API_PORT=") {
                            if let Ok(port) = port_str.trim().parse::<u16>() {
                                *handle.state::<ApiPort>().0.lock().unwrap() = port;
                            }
                        }
                    }
                    CommandEvent::Stderr(line) => {
                        eprintln!("[kasaio:release] {}", String::from_utf8_lossy(&line));
                    }
                    CommandEvent::Terminated(status) => {
                        eprintln!("[kasaio:release] terminated: {:?}", status);
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    pub fn kill(app: &tauri::AppHandle) {
        if let Some(child) = app.state::<Sidecar>().0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}