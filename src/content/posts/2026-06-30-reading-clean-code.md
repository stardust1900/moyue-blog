---
title: "《代码整洁之道》读书笔记：写出可维护的代码"
date: 2026-06-30
category: "读书笔记"
tags: ["读书","编程","软件工程"]
description: "Robert C. Martin 的经典之作，教导我们如何通过命名、函数、注释等细节写出真正干净的代码。"
coverEmoji: "📚"
draft: false
---

## 为什么代码整洁很重要

> "花在阅读代码和编写代码上的时间比例远超 10:1。" —— Robert C. Martin

我们大部分时间都在阅读代码，而不是写代码。整洁的代码让阅读更轻松，让维护成本更低，让 Bug 更少。

## 有意义的命名

### 避免误导

```typescript
// ❌ 坏命名
const d: number; // 消逝的时间？距离？数据？
const accountList: Account[]; // 如果不是 List 类型呢？
let a = 1, l = 1, I = 1; // 看起来一样

// ✅ 好命名
const elapsedTimeInDays: number;
const accounts: Account[];
```

### 使用可搜索的名称

```typescript
// ❌ 难以搜索
for (let i = 0; i < 34; i++) {
  // 34 是什么？
}

// ✅ 意图明确
const MAX_CLASSES_PER_STUDENT = 34;
for (let i = 0; i < MAX_CLASSES_PER_STUDENT; i++) {
  // ...
}
```

## 函数应该短小精悍

### 第一规则：函数应该短小

```typescript
// ❌ 一个函数做了太多事
function processUser(users: User[]) {
  users.forEach(user => {
    if (user.active) {
      if (user.age > 18) {
        if (user.role === 'admin') {
          // 30 行代码...
        }
      }
    }
  });
}

// ✅ 拆分为小函数
function processUsers(users: User[]): void {
  users
    .filter(isActiveAdultAdmin)
    .forEach(processAdminUser);
}

function isActiveAdultAdmin(user: User): boolean {
  return user.active && user.age > 18 && user.role === 'admin';
}
```

### 函数应该只做一件事

判断标准：**你能否将函数中的部分代码提取为独立的函数？** 如果能，它就做了不止一件事。

## 注释的哲学

### 好注释

- 法律信息
- 对意图的解释
- 警告
- TODO 注释

### 坏注释

```typescript
// ❌ 多余的注释
// 创建用户
function createUser() { }

// ❌ 误导性注释
// 检查用户是否有效
function validateUser(user) {
  return user.name !== ''; // 实际只检查了 name
}

// ✅ 用代码表达意图
function isUserNameProvided(user: User): boolean {
  return user.name.trim().length > 0;
}
```

## 错误处理

```typescript
// ❌ 嵌套的错误处理
function getData() {
  try {
    const data = fetch();
    try {
      const parsed = parse(data);
      return parsed;
    } catch (e) {
      log(e);
      return null;
    }
  } catch (e) {
    log(e);
    return null;
  }
}

// ✅ 抽取错误处理
function getData(): Result<Data> {
  return Result.try(() => parse(fetch()));
}
```

## 对我编程习惯的改变

读完这本书后，我开始刻意练习：

1. **命名时多花 30 秒** — 好名字胜过好注释
2. **函数限制在 20 行内** — 超过就考虑拆分
3. **参数不超过 3 个** — 超过就用对象封装
4. **消除嵌套** — 用 early return 减少层级

## 总结

整洁代码的核心原则：

- **可读性优先** — 代码是写给人看的
- **单一职责** — 每个函数/类只做一件事
- **表达意图** — 用命名和结构代替注释
- **持续重构** — 让代码随时间变得更好

> "让你的代码比你接手时更干净。" —— 童子军规则
