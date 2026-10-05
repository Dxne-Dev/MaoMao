// Web Demo Driver for GitHub Pages
// Renders the real MaoMao Island & Mascot engine with realistic simulated states

import "./style.css";
import { State, type AgentTask } from "./core/state";
import { Island } from "./island/island";

export function startDemo() {
  const root = document.getElementById("root");
  if (!root) return;

  // Configure initial settings
  State.settings = {
    ...State.settings,
    soundEnabled: false,
    activeIntegrations: ["integration_github", "integration_vercel", "integration_stripe"]
  };

  const island = new Island(root);
  island.applySettings();
  State.loadIntegrationTasks();

  // Follow cursor inside demo container
  island.followPageCursor();

  // Initialize a mock task
  const claudeTask: AgentTask = {
    id: "claude_session_1",
    name: "Claude Code",
    color: "#22C55E",
    state: "working",
    stepIndex: 1,
    steps: ["Vérification des dépendances", "Compilation Rust de src-tauri...", "Tests unitaires"],
    source: "claudeCode",
    isIntegration: false
  };

  State.tasks = [claudeTask];

  // Reveal island in compact mode
  island.reveal();

  function setScenario(name: string) {
    if (name === "agent") {
      State.pendingApproval = null;
      claudeTask.state = "working";
      claudeTask.stepIndex = 1;
      island.alert("overview");
    } else if (name === "permission") {
      State.pendingApproval = {
        requestId: "req_42",
        sessionId: "claude_session_1",
        tool: "Bash",
        command: "cargo build --release -p maomao && npm run build"
      };
      claudeTask.state = "approval";
      island.alert("approval");
    } else if (name === "cloud") {
      State.pendingApproval = null;
      claudeTask.state = "finished";
      island.alert("overview");
    } else if (name === "compact") {
      State.pendingApproval = null;
      island.reveal();
    }
  }

  // Handle parent window messages
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SET_SCENARIO") {
      setScenario(event.data.scenario);
    }
  });

  // Cycle scenarios automatically if idle
  let timer: number | null = null;
  const list = ["agent", "permission", "cloud"];
  let idx = 0;

  function autoCycle() {
    idx = (idx + 1) % list.length;
    setScenario(list[idx]);
  }

  timer = window.setInterval(autoCycle, 5500);

  // Stop auto cycle if user interacts
  document.addEventListener("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });

  // Initial state
  setScenario("agent");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startDemo);
} else {
  startDemo();
}
