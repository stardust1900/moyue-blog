---
title: "Node.js 事件循环机制详解"
date: 2026-06-22
category: "后端技术"
tags: ["Node.js","JavaScript","后端"]
description: "理解 Node.js 的异步非阻塞 I/O 模型，深入 Event Loop 的各个阶段和微任务/宏任务调度。"
coverEmoji: "🟢"
draft: false
---

## 什么是事件循环

Node.js 是单线程的，但它能处理高并发。秘诀就在于 **事件循环（Event Loop）**——一个持续运行的循环，负责调度异步任务的执行。

## 事件循环的六个阶段

```
┌───────────────────────────┐
┌─>│         timers             │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll             │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check            │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks       │
   └───────────────────────────┘
```

### 1. Timers 阶段

处理 `setTimeout` 和 `setInterval` 到期的回调。

```javascript
setTimeout(() => {
  console.log('timer');
}, 0);
```

### 2. Pending Callbacks

执行上一轮循环延迟的 I/O 回调。

### 3. Poll 阶段

获取新的 I/O 事件，执行 I/O 相关的回调。

### 4. Check 阶段

执行 `setImmediate` 的回调。

```javascript
setImmediate(() => {
  console.log('immediate');
});
```

### 5. Close Callbacks

执行 close 事件的回调，如 `socket.on('close', ...)`。

## 微任务 vs 宏任务

### 微任务（Microtask）

- `Promise.then/catch/finally`
- `process.nextTick`（Node.js 特有，优先级最高）
- `queueMicrotask`

### 宏任务（Macrotask）

- `setTimeout`
- `setInterval`
- `setImmediate`
- I/O 回调

### 执行顺序

```javascript
console.log('1: start');

setTimeout(() => console.log('2: timeout'), 0);

setImmediate(() => console.log('3: immediate'));

Promise.resolve().then(() => console.log('4: promise'));

process.nextTick(() => console.log('5: nextTick'));

console.log('6: end');

// 输出顺序：
// 1: start
// 6: end
// 5: nextTick
// 4: promise
// 2: timeout (或 3: immediate)
// 3: immediate (或 2: timeout)
```

> **注意**：在同一个事件循环中，setTimeout 和 setImmediate 的顺序不确定。但在 I/O 回调中，setImmediate 总是先于 setTimeout。

## 常见陷阱

### 阻塞事件循环

```javascript
// ❌ 阻塞事件循环
app.get('/heavy', (req, res) => {
  const result = fibonacci(50); // 同步计算，阻塞所有请求
  res.send(result);
});

// ✅ 使用 Worker Threads
import { Worker } from 'worker_threads';

app.get('/heavy', (req, res) => {
  const worker = new Worker('./fib-worker.js');
  worker.on('message', (result) => res.send(result));
  worker.postMessage(50);
});
```

## 实际应用

理解事件循环对性能优化至关重要：

1. **避免同步计算** — CPU 密集型任务用 Worker
2. **合理使用 nextTick** — 它会阻塞 I/O
3. **批量处理** — 减少事件循环迭代次数

## 总结

Node.js 事件循环的核心要点：

- **单线程但非阻塞** — I/O 操作委托给系统
- **六阶段循环** — 每个阶段处理特定类型的回调
- **微任务优先** — 每个阶段之间清空微任务队列
- **nextTick 最优先** — 甚至在 Promise 之前

掌握事件循环，才能真正理解 Node.js 的并发模型。
