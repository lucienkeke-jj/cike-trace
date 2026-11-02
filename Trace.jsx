/**
 * 此刻 <trace> 的前端卡片（React，零依赖）
 *
 * 挂在 AI 那条消息气泡下面：平时只露一个「✦ 气味名 ▸」，点开才看到情绪和心里话。
 * 锁着的只显示一把锁——原文根本不该发到前端来。
 *
 *   <TraceStrip trace={msg.trace} />      // trace 是 stripTrace() 给的对象，或存库后的 JSON 字符串
 *
 * 颜色用 CSS 变量，没设就用默认值：--trace-text / --trace-soft / --trace-accent
 */
import { useState } from "react";

const C = {
  text: "var(--trace-text, #3a322b)",
  soft: "var(--trace-soft, #8a7e6e)",
  accent: "var(--trace-accent, #c4a060)",
  rule: "color-mix(in srgb, var(--trace-accent, #c4a060) 25%, transparent)",
};
const SERIF = "'Noto Serif SC', 'Songti SC', serif";
const CHOICES = [["want", "想要"], ["chose", "选了"], ["held", "忍住"]];

function toTrace(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

function TraceBody({ t }) {
  const moves = Array.isArray(t.moves) ? t.moves : [];
  const choices = CHOICES.filter(([k]) => t[k]);
  const divider = (on) => (on ? { marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.rule}` } : {});
  return (
    <div style={{ padding: "8px 2px 2px" }}>
      {moves.map((m, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5, lineHeight: 1.9, color: C.text }}>
          <span>{m.name}</span>
          <span style={{ color: C.soft, whiteSpace: "nowrap" }}>{m.dir === "down" ? "↓" : "↑"} {m.level || ""}</span>
        </div>
      ))}
      {choices.length > 0 && (
        <div style={divider(moves.length > 0)}>
          {choices.map(([k, label]) => (
            <div key={k} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.75, color: C.text }}>
              <span style={{ color: C.soft, flexShrink: 0 }}>{label}</span>
              <span>{t[k]}</span>
            </div>
          ))}
        </div>
      )}
      {t.note && (
        <div style={{ ...divider(moves.length > 0 || choices.length > 0), fontSize: 14, lineHeight: 1.8, color: C.soft, fontStyle: "italic", whiteSpace: "pre-wrap", fontFamily: SERIF }}>
          {t.note}
        </div>
      )}
    </div>
  );
}

export function TraceStrip({ trace }) {
  const t = toTrace(trace);
  const [open, setOpen] = useState(false);
  if (!t) return null;

  if (t.locked) {
    return <div style={{ marginTop: 6, padding: "0 6px", fontSize: 12, color: C.soft, opacity: 0.7 }}>🔒 这一刻留给了自己</div>;
  }

  const hasBody = (t.moves && t.moves.length) || t.want || t.chose || t.held || t.note;
  return (
    <div style={{ marginTop: 6, maxWidth: 420 }}>
      <button
        onClick={() => hasBody && setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "2px 6px",
          cursor: hasBody ? "pointer" : "default", fontSize: 13.5, color: C.soft, fontFamily: SERIF,
        }}>
        <span style={{ color: C.accent, fontSize: 11 }}>✦</span>
        <span>{t.scent || "此刻"}</span>
        {hasBody && <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? "▾" : "▸"}</span>}
      </button>
      {open && hasBody && (
        <div style={{ margin: "2px 0 0 6px", padding: "0 10px", borderLeft: `2px solid ${C.rule}` }}>
          <TraceBody t={t} />
        </div>
      )}
    </div>
  );
}
