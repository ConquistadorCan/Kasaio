use std::sync::Mutex;
use tauri::{Manager, State};

pub struct ApiPort(pub Mutex<u16>);
pub struct BackendReady(pub Mutex<bool>);

#[tauri::command]
fn get_api_port(state: State<ApiPort>) -> u16 {
    *state.0.lock().unwrap()
}

#[tauri::command]
fn log_frontend_error(_app: tauri::AppHandle, message: String) {
    #[cfg(debug_assertions)]
    eprintln!("[kasaio:frontend] {}", message);

    #[cfg(not(debug_assertions))]
    {
        use std::io::Write;
        if let Ok(data_dir) = _app.path().app_data_dir() {
            let log_dir = data_dir.join("logs");
            let _ = std::fs::create_dir_all(&log_dir);
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(log_dir.join("frontend.log"))
            {
                let _ = writeln!(file, "{}", message);
            }
        }
    }
}

// Called by React when it has set up its event listener and is ready to receive backend-ready
#[tauri::command]
fn frontend_ready(app: tauri::AppHandle) {
    use tauri::Emitter;
    let port = *app.state::<ApiPort>().0.lock().unwrap();
    let backend_ready = *app.state::<BackendReady>().0.lock().unwrap();
    eprintln!("[kasaio] frontend ready, backend_ready={}, port={}", backend_ready, port);

    if backend_ready && port != 0 {
        let _ = app.emit("backend_ready", port);
        eprintln!("[kasaio] emitting backend_ready event");
    } else {
        *app.state::<BackendReady>().0.lock().unwrap() = false;
        eprintln!("[kasaio] frontend ready, but backend is not ready");
    }
}

async fn wait_for_backend(port: u16, handle: tauri::AppHandle) {
    use tauri::Emitter;
    let health_url = format!("http://127.0.0.1:{}/health", port);
    let max_attempts = 5;

    for attempt in 1..=max_attempts {
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        if let Ok(resp) = reqwest::get(&health_url).await {
            if resp.status().is_success() {
                *handle.state::<ApiPort>().0.lock().unwrap() = port;
                *handle.state::<BackendReady>().0.lock().unwrap() = true;
                let _ = handle.emit("backend-ready", port);
                eprintln!("[kasaio] backend ready on port {}", port);
                return;
            }
        }
        eprintln!("[kasaio] health check attempt {}/{} failed", attempt, max_attempts);
    }

    let msg = format!("Backend failed to start after {} attempts on port {}", max_attempts, port);
    eprintln!("[kasaio] {}", msg);

    #[cfg(not(debug_assertions))]
    if let Ok(data_dir) = handle.path().app_data_dir() {
        use std::io::Write;
        let log_dir = data_dir.join("logs");
        let _ = std::fs::create_dir_all(&log_dir);
        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("backend.log"))
        {
            let _ = writeln!(file, "[ERROR] {}", msg);
        }
    }

    let _ = handle.emit("backend_failed", msg);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ApiPort(Mutex::new(0)))
        .manage(BackendReady(Mutex::new(false)))
        .setup(setup)
        .on_window_event(on_window_event)
        .invoke_handler(tauri::generate_handler![get_api_port, log_frontend_error, frontend_ready])
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

// Dev mode — spawns venv Python directly so sys.frozen is False
#[cfg(debug_assertions)]
mod dev {
    use super::wait_for_backend;
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
                eprintln!("[kasaio:dev] {}", line);
                if let Some(port_str) = line.trim().strip_prefix("KASAIO_API_PORT=") {
                    if let Ok(port) = port_str.trim().parse::<u16>() {
                        let handle = handle.clone();
                        tauri::async_runtime::spawn(async move {
                            wait_for_backend(port, handle).await;
                        });
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

// Release mode — uses the bundled PyInstaller sidecar
#[cfg(not(debug_assertions))]
mod release {
    use super::wait_for_backend;
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
                        eprintln!("[kasaio:release] {}", text);
                        if let Some(port_str) = text.trim().strip_prefix("KASAIO_API_PORT=") {
                            if let Ok(port) = port_str.trim().parse::<u16>() {
                                let handle = handle.clone();
                                tauri::async_runtime::spawn(async move {
                                    wait_for_backend(port, handle).await;
                                });
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

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/IM", "python-sidecar.exe"])
                .creation_flags(0x08000000)
                .output();
        }
    }
}