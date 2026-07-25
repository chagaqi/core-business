"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent/types";
import type { ChecklistStep } from "./ToolChecklist";

/**
 * useAgentStream (SWAN SPRINT P2, build step 1) — the client half of the agent
 * seam: POSTs to /api/agent/stream and folds the SSE AgentEvents into exactly
 * the state the beats render (ToolChecklist steps, streaming text, terminal
 * status). EventSource can't POST, so this reads the fetch body stream.
 *
 * Terminal statuses map the never-dead-end branches (P2-FLOW spec):
 *  - "done"      → render the text
 *  - "disabled"  → agent env unset (503) → manual branch, no error tone
 *  - "rejected"  → guardrails blocked the output → manual branch
 *  - "error"     → provider/stream failure (incl. mid-stream drop) → manual branch
 */

export type AgentStreamStatus = "idle" | "running" | "done" | "disabled" | "rejected" | "error";

export interface AgentStreamState {
  status: AgentStreamStatus;
  checklist: ChecklistStep[];
  text: string;
  toolCount: number;
  reason?: string;
}

const IDLE: AgentStreamState = { status: "idle", checklist: [], text: "", toolCount: 0 };

function reduce(prev: AgentStreamState, event: AgentEvent): AgentStreamState {
  switch (event.type) {
    case "tool_started":
      return {
        ...prev,
        checklist: [
          // the runner is sequential: a new start closes any still-active step
          ...prev.checklist.map((s) => (s.state === "active" ? { ...s, state: "done" as const } : s)),
          { label: event.label, state: "active" as const },
        ],
      };
    case "tool_done":
      return {
        ...prev,
        toolCount: prev.toolCount + 1,
        checklist: prev.checklist.map((s, i) =>
          i === prev.checklist.length - 1
            ? { ...s, state: "done" as const, note: event.ok ? undefined : "failed" }
            : s,
        ),
      };
    case "text_delta":
      return { ...prev, text: prev.text + event.text };
    case "turn_done":
      return { ...prev, text: event.text, toolCount: event.toolCount, status: "done" };
    case "guardrail_rejected":
      return { ...prev, status: "rejected", reason: event.reason };
    case "agent_error":
      return {
        ...prev,
        status: event.message === "agent-disabled" ? "disabled" : "error",
        reason: event.message,
      };
    default:
      return prev;
  }
}

export function useAgentStream() {
  const [state, setState] = useState<AgentStreamState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const start = useCallback(async (skill: string, input: string): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ ...IDLE, status: "running" });
    try {
      const res = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skill, input }),
        signal: controller.signal,
      });
      if (res.status === 503) {
        setState((s) => ({ ...s, status: "disabled", reason: "agent-disabled" }));
        return;
      }
      if (!res.ok || !res.body) {
        setState((s) => ({ ...s, status: "error", reason: `http-${res.status}` }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Delta batching: fast providers stream 100+ tokens/sec, and a setState
      // per token can freeze the renderer on a long transcript (seen live
      // 2026-07-25). Coalesce text deltas and flush on a ~40ms cadence; any
      // non-text event flushes first so ordering is preserved.
      let pendingText = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flushText = () => {
        if (!pendingText) return;
        const chunk = pendingText;
        pendingText = "";
        setState((prev) => reduce(prev, { type: "text_delta", text: chunk }));
      };
      const apply = (event: AgentEvent) => {
        if (event.type === "text_delta") {
          pendingText += event.text;
          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              flushText();
            }, 40);
          }
          return;
        }
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flushText();
        setState((prev) => reduce(prev, event));
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            apply(JSON.parse(line.slice(6)) as AgentEvent);
          } catch {
            /* torn frame — the next complete one carries state forward */
          }
        }
      }
      if (flushTimer) clearTimeout(flushTimer);
      flushText();
      // stream closed without a terminal event = the mid-stream-drop branch
      setState((prev) =>
        prev.status === "running" ? { ...prev, status: "error", reason: "stream-ended" } : prev,
      );
    } catch (err) {
      if (controller.signal.aborted) return; // caller cancelled — keep whatever state we had
      setState((prev) =>
        prev.status === "running"
          ? { ...prev, status: "error", reason: err instanceof Error ? err.message : "fetch-failed" }
          : prev,
      );
    }
  }, []);

  return { ...state, start, cancel };
}
