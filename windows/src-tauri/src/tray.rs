// Notification-area icon: Open, Settings, Pause, Quit.

use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};

use crate::island::WINDOW_LABEL;

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open MaoMao", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(app, &[&open, &sep1, &settings, &pause, &sep2, &quit])?;

    // Try to load the dedicated menu bar icon (black & white design).
    // Fall back to the default app icon if the resource is unavailable.
    let tray_icon = app
        .path()
        .resource_dir()
        .ok()
        .and_then(|dir| {
            let p = dir.join("icons/tray-icon.png");
            std::fs::read(&p).ok().and_then(|b| Image::from_bytes(&b).ok())
        })
        .or_else(|| app.default_window_icon().cloned());

    let mut builder = TrayIconBuilder::with_id("maomao")
        .tooltip("MaoMao")
        .menu(&menu)
        .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "settings" => crate::show_settings_window(app),
            id => {
                let _ = app.emit_to(WINDOW_LABEL, "tray", id.to_string());
            }
        });

    if let Some(icon) = tray_icon {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}
