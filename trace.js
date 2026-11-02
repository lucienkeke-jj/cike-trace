// 此刻 <trace> —— 从 AI 回复里剥出它自己写的「心里的地方」
// 零依赖，Node 和浏览器都能用。
//
//   const { text, trace } = stripTrace(reply);
//   // text  → 发给用户的正文（<trace> 已经剥掉）
//   // trace → null / { locked: true, privateBody } / { scent, moves, want, chose, held, note }
//
// 原则：格式松、解析宽。模型的写法每天都会漂，解析器要尽量接住，而不是要求它写得规整。

const TRACE_RE = /<trace(\s+lock(?:ed)?)?\s*>([\s\S]*?)<\/trace>/gi;
// 忘了闭合：<trace> 一般写在最后，就当它一直到结尾
const TRACE_OPEN_RE = /<trace(\s+lock(?:ed)?)?\s*>([\s\S]*)$/i;
const TRACE_KEYS = { "想要": "want", "选了": "chose", "忍住": "held", "忍住了": "held" };

export function stripTrace(text) {
  let trace = null;
  const take = (_m, lock, body) => {
    if (!body.trim()) return "";
    trace = lock ? { locked: true, privateBody: body.trim() } : parseTrace(body);
    return "";
  };
  const cleaned = String(text || "")
    .replace(TRACE_RE, take)
    .replace(TRACE_OPEN_RE, take)
    .replace(/<\/?trace[^>]*>/gi, "")
    .trim();
  return { text: cleaned, trace };
}

// 能接住的写法（都见过）：
//   一行写完：   雨后的旧书页 · 安心 ↑明显 · 期待周末
//   分几行写：   气味：烤栗子 / 想念 ↑轻微，烦躁 ↓ / 想要：… 选了：… 忍住：…
//   第一行很短、后面还有别的行：当气味名
// 带箭头的 = 情绪怎么动了；情绪前面那段没箭头的 = 气味名；剩下的 = 一句心里话。
export function parseTrace(body) {
  const t = { scent: null, moves: [], want: null, chose: null, held: null, note: null };
  const rest = [];

  const takeSegs = (line) => {
    let seenMove = false;
    for (let seg of line.split(/[·•｜|；;]+/)) {
      seg = seg.trim().replace(/^[，,]+|[，,]+$/g, "");
      if (!seg) continue;
      if (/[↑↓]/.test(seg)) {
        for (const sub of seg.split(/[，,]+/)) {
          const m = sub.trim().match(/^(.+?)\s*([↑↓])\s*(.*)$/);
          if (m) {
            seenMove = true;
            t.moves.push({ name: m[1].trim().slice(0, 12), dir: m[2] === "↑" ? "up" : "down", level: m[3].trim().slice(0, 6) || null });
          } else if (sub.trim()) rest.push(sub.trim());
        }
      } else if (!seenMove && !t.scent) t.scent = seg.slice(0, 40);
      else rest.push(seg);
    }
  };

  const lines = String(body || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const sm = line.match(/^气味\s*[：:]\s*(.+)$/);
    if (sm) { t.scent = sm[1].trim().slice(0, 40); return; }

    if (/(想要|选了|忍住了?)\s*[：:]/.test(line)) {
      const parts = line.split(/(想要|选了|忍住了?)\s*[：:]/);
      const head = parts[0].trim().replace(/[·•｜|；;\s]+$/, "");
      if (head) { if (/[↑↓]/.test(head)) takeSegs(head); else rest.push(head); }
      for (let k = 1; k < parts.length; k += 2) {
        const v = (parts[k + 1] || "").trim().replace(/[，,；;·\s　]+$/, "");
        if (v) t[TRACE_KEYS[parts[k]]] = v.slice(0, 200);
      }
      return;
    }
    if (/[↑↓]/.test(line)) { takeSegs(line); return; }
    if (i === 0 && !t.scent && lines.length > 1 && line.length <= 20) { t.scent = line; return; }
    rest.push(line);
  });

  if (rest.length) t.note = rest.join("\n").slice(0, 600);
  t.moves = t.moves.slice(0, 8);
  return t;
}
