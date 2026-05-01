fn main() {
    ensure_dev_sidecar_placeholder();
    tauri_build::build()
}

fn ensure_dev_sidecar_placeholder() {
    if std::env::var("PROFILE").as_deref() != Ok("debug") {
        return;
    }

    let target = match std::env::var("TARGET") {
        Ok(target) => target,
        Err(_) => return,
    };

    let manifest_dir = match std::env::var("CARGO_MANIFEST_DIR") {
        Ok(manifest_dir) => std::path::PathBuf::from(manifest_dir),
        Err(_) => return,
    };

    let binaries_dir = manifest_dir.join("binaries");
    if std::fs::create_dir_all(&binaries_dir).is_err() {
        return;
    }

    let extension = if cfg!(windows) { ".exe" } else { "" };
    let sidecar_path = binaries_dir.join(format!("python-sidecar-{target}{extension}"));
    if sidecar_path.exists() {
        return;
    }

    let contents = if cfg!(windows) {
        Vec::new()
    } else {
        b"#!/bin/sh\nexit 0\n".to_vec()
    };

    if std::fs::write(&sidecar_path, contents).is_ok() {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(metadata) = std::fs::metadata(&sidecar_path) {
                let mut permissions = metadata.permissions();
                permissions.set_mode(0o755);
                let _ = std::fs::set_permissions(&sidecar_path, permissions);
            }
        }
    }
}
