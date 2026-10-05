// Entry point: boot the bridge, wire the island, start the greeting.

import "./style.css";
import { Bridge, IS_TAURI, onEvent } from "./core/bridge";
import { Sound } from "./core/sound";
import { State, type Settings } from "./core/state";
import { Island } from "./island/island";
import { registerHookHandlers } from "./island/hooks";
import { registerIntegrationHandlers, refreshConfigured } from "./island/integrations";

async function main() {
  const root = document.getElementById("root");
  if (!root) return;

  void Sound.preload();

  const island = new Island(root);

  const boot = await Bridge.boot();
  if (boot) {
    State.settings = { ...State.settings, ...boot.settings };
  }
  island.applySettings();
  State.loadIntegrationTasks();
  if (boot && !boot.cursorPoll) island.followPageCursor();

  await onEvent<{ x: number; y: number }>("cursor", ({ x, y }) => island.onCursor(x, y));

  /** Pause has to reach Rust too, or the pollers keep calling out. */
  const setPaused = (on: boolean) => {
    if (State.paused === on) return;
    State.paused = on;
    void Bridge.setPaused(on);
  };

  await onEvent<string>("tray", (what) => {
    switch (what) {
      case "settings":
        setPaused(false);
        island.alert("settings");
        break;
      case "open":
        setPaused(false);
        island.alert(State.defaultView());
        break;
      case "pause":
        setPaused(!State.paused);
        if (State.paused) island.fsm.forceHidden();
        else island.reveal();
        break;
    }
  });

  await onEvent<null>("screen-changed", () => void Bridge.reposition());

  // The settings window writes preferences; apply them here without a restart.
  await onEvent<Settings>("settings-changed", (s) => {
    State.settings = { ...State.settings, ...s };
    island.applySettings();
    State.loadIntegrationTasks();
    void refreshConfigured();
  });

  registerHookHandlers(island);
  registerIntegrationHandlers(island);

  island.launch();

  // Expose global test interface & shortcuts
  (window as any).maomao = {
    island,
    engine: (island as any).engine,
    emote: (name: any) => {
      (island as any).engine.triggerEmote(name);
      Sound.play(name === "love" ? "love" : "blip");
    },
    state: (name: any) => {
      State.stateOverride = name;
      (island as any).engine.setState(name);
      Sound.play(name);
    },
    reset: () => {
      State.stateOverride = null;
      (island as any).engine.setState("idle");
    },
    open: (view?: any) => {
      island.alert(view || State.defaultView());
    },
    collapse: () => {
      island.collapse();
    },
    drop: (fileName = "sample_file.png") => {
      const p = fileName.startsWith("mock:") || fileName.includes(":\\") || fileName.startsWith("/")
        ? fileName
        : `mock:${fileName}`;
      (island as any).onDragDrop({ type: "enter", paths: [p] });
      setTimeout(() => {
        (island as any).onDragDrop({ type: "drop", paths: [p] });
      }, 700);
    },
  };

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const testMap: Record<string, () => void> = {
      "1": () => (window as any).maomao.emote("love"),
      "2": () => (window as any).maomao.emote("happy"),
      "3": () => (window as any).maomao.emote("proud"),
      "4": () => (window as any).maomao.emote("wink"),
      "5": () => (window as any).maomao.state("thinking"),
      "6": () => (window as any).maomao.state("searching"),
      "7": () => (window as any).maomao.state("approval"),
      "8": () => (window as any).maomao.state("sleeping"),
      "9": () => (window as any).maomao.state("dizzy"),
      "0": () => (window as any).maomao.reset(),
      "d": () => (window as any).maomao.drop("sample_file.png"),
      "D": () => (window as any).maomao.drop("sample_file.png"),
    };
    if (testMap[e.key]) testMap[e.key]();
  });

  // In a plain browser there is no wake strip behind the cursor: make the whole
  // page wake the island so the visuals can be checked with `npm run dev`.
  if (!IS_TAURI) {
    document.addEventListener("click", () => Sound.resume(), { once: true });
  }
}

void main();
