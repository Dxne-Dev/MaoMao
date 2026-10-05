// Web Demo Driver for GitHub Pages
// Plays a seamless autonomous story loop from greeting to agent tracking, approval and completion.

import "./style.css";
import { State, type AgentTask } from "./core/state";
import { Island } from "./island/island";

export function startDemo() {
  const root = document.getElementById("root");
  if (!root) return;

  State.settings = {
    ...State.settings,
    soundEnabled: false,
    activeIntegrations: ["integration_github", "integration_vercel", "integration_stripe"]
  };

  const island = new Island(root);
  island.applySettings();
  State.loadIntegrationTasks();
  island.followPageCursor();

  const claudeTask: AgentTask = {
    id: "claude_session_1",
    name: "Claude Code",
    color: "#22C55E",
    state: "working",
    stepIndex: 1,
    steps: ["Analyse du code source", "Vérification des dépendances", "Compilation Rust"],
    source: "claudeCode",
    isIntegration: false
  };

  State.tasks = [claudeTask];

  // Story sequence runner
  function playSequence() {
    // 1. Start with Greeting
    State.pendingApproval = null;
    claudeTask.state = "idle";
    island.alert("greeting");

    // 2. Active Agent Session after greeting (approx 4.6s)
    setTimeout(() => {
      claudeTask.state = "working";
      claudeTask.stepIndex = 1;
      island.alert("overview");
    }, 4700);

    // 3. Permission Request pops up
    setTimeout(() => {
      State.pendingApproval = {
        requestId: "req_demo",
        sessionId: "claude_session_1",
        tool: "Bash",
        command: "cargo build --release -p maomao && npm test"
      };
      claudeTask.state = "approval";
      island.alert("approval");
    }, 9500);

    // 4. Approval decision & Execution
    setTimeout(() => {
      State.pendingApproval = null;
      claudeTask.state = "finished";
      island.alert("finished");
    }, 14500);

    // 5. Compact Idle & loop back
    setTimeout(() => {
      island.reveal();
    }, 18500);

    // 6. Restart loop
    setTimeout(() => {
      playSequence();
    }, 22000);
  }

  // Launch initial sequence
  playSequence();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startDemo);
} else {
  startDemo();
}
