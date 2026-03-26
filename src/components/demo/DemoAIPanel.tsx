import { useEffect, useRef } from "react";

export type DemoStatus = "idle" | "running" | "done" | "error";

export interface LogEntry {
  id: number;
  time: string;
  text: string;
}

interface Props {
  status: DemoStatus;
  logs: LogEntry[];
  onStart: () => void;
  onRefresh: () => void;
}

function logIcon(text: string) {
  if (text.startsWith("📸")) return "";
  if (text.startsWith("🖱️")) return "";
  if (text.startsWith("⌨️")) return "";
  if (text.startsWith("✅")) return "";
  if (text.startsWith("🔄")) return "";
  if (text.startsWith("❌")) return "";
  if (text.startsWith("🧠")) return "";
  return "→";
}

export default function DemoAIPanel({ status, logs, onStart, onRefresh }: Props) {
  const logListRef = useRef<HTMLDivElement>(null);

  // Scroll to top when new logs appear (newest at top)
  useEffect(() => {
    if (logListRef.current) {
      logListRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  const isRunning = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <div className="dap-root">
      {/* Header */}
      <div className="dap-header">
        <div className="dap-title">
          <span className="dap-title-icon">🤖</span>
          AI Agent
        </div>
        <div className="dap-subtitle">Agentic Computer Use · Azure OpenAI</div>
      </div>

      {/* Action button */}
      <div className="dap-btn-row">
        {!isDone && !isError ? (
          <button
            className="dap-start-btn"
            onClick={onStart}
            disabled={isRunning}
            aria-label={isRunning ? "AI agent is running" : "Start demo"}
          >
            {isRunning ? (
              <>
                <span className="dap-spinner" aria-hidden="true" />
                Running…
              </>
            ) : (
              <>
                <span className="dap-play-icon" aria-hidden="true">▶</span>
                Start Demo
              </>
            )}
          </button>
        ) : (
          <button
            className="dap-refresh-btn"
            onClick={onRefresh}
            aria-label="Refresh and run again with new patient data"
          >
            <span aria-hidden="true">↺</span>
            &nbsp;Refresh
          </button>
        )}
      </div>

      {/* Status indicator */}
      {isRunning && (
        <div className="dap-thinking">
          <span className="dap-thinking-dot" />
          <span className="dap-thinking-dot" />
          <span className="dap-thinking-dot" />
          <span className="dap-thinking-text">AI is thinking…</span>
        </div>
      )}

      {isDone && (
        <div className="dap-complete-banner">
          ✅ Workflow complete
        </div>
      )}

      {isError && (
        <div className="dap-error-banner">
          ❌ An error occurred — check console
        </div>
      )}

      {/* Divider */}
      <div className="dap-divider" />

      {/* Log title */}
      <div className="dap-log-header">
        <span className="dap-log-label">Activity Log</span>
        {logs.length > 0 && (
          <span className="dap-log-count">{logs.length} steps</span>
        )}
      </div>

      {/* Log list — newest at top */}
      <div className="dap-log-list" ref={logListRef}>
        {logs.length === 0 ? (
          <div className="dap-log-empty">
            Click <strong>Start Demo</strong> to watch the AI complete a prior-authorization workflow.
          </div>
        ) : (
          [...logs].reverse().map((entry) => (
            <div key={entry.id} className="dap-log-entry">
              <span className="dap-log-time">{entry.time}</span>
              <span className="dap-log-icon" aria-hidden="true">{logIcon(entry.text)}</span>
              <span className="dap-log-text">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
