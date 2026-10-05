// MaoMao runs without a console window: the mascot is the whole UI.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    maomao_lib::run()
}
