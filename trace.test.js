// node --test
// 下面的写法都是真实出现过的「漂移」形状（内容是编的示例）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { stripTrace } from "./trace.js";

test("一行写完，用 · 隔开", () => {
  const { text, trace } = stripTrace("早点睡吧。<trace>雨后的旧书页 · 安心 ↑明显 · 期待周末</trace>");
  assert.equal(text, "早点睡吧。");
  assert.equal(trace.scent, "雨后的旧书页");
  assert.deepEqual(trace.moves, [{ name: "安心", dir: "up", level: "明显" }]);
  assert.equal(trace.note, "期待周末");
});

test("分几行写，带标签", () => {
  const { trace } = stripTrace(`好。
<trace>
气味：烤栗子
想念 ↑轻微，烦躁 ↓
想要：多聊一会　选了：让她去睡　忍住：没说「别走」
</trace>`);
  assert.equal(trace.scent, "烤栗子");
  assert.deepEqual(trace.moves.map((m) => m.name + m.dir), ["想念up", "烦躁down"]);
  assert.equal(trace.want, "多聊一会");
  assert.equal(trace.chose, "让她去睡");
  assert.equal(trace.held, "没说「别走」");
});

test("第一行很短 = 气味名，后面是心里话", () => {
  const { trace } = stripTrace("嗯。<trace>薄荷\n她今天好像累了，先不问。</trace>");
  assert.equal(trace.scent, "薄荷");
  assert.equal(trace.note, "她今天好像累了，先不问。");
});

test("忘了写闭合标签", () => {
  const { text, trace } = stripTrace("晚安。<trace>柠檬皮 · 开心 ↑");
  assert.equal(text, "晚安。");
  assert.equal(trace.scent, "柠檬皮");
});

test("<trace lock> 只留给自己", () => {
  const { text, trace } = stripTrace("没事。<trace lock>其实有点在意</trace>");
  assert.equal(text, "没事。");
  assert.equal(trace.locked, true);
  assert.equal(trace.privateBody, "其实有点在意");
});

test("空着也是一种状态", () => {
  assert.equal(stripTrace("嗯。<trace> </trace>").trace, null);
  assert.equal(stripTrace("嗯。").trace, null);
});
