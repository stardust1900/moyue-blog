---
title: "TypeScript 高级类型编程指南"
date: 2026-07-20
category: "前端技术"
tags: ["TypeScript","JavaScript","前端"]
description: "掌握条件类型、映射类型、模板字面量类型等高级技巧，写出类型安全的通用工具函数。"
coverEmoji: "📘"
draft: false
---

## 为什么需要高级类型

TypeScript 的类型系统是图灵完备的。这意味着你可以在类型层面进行复杂的计算和逻辑推理。高级类型能帮助我们：

- 捕获更多运行时错误
- 提供更好的 IDE 自动补全
- 让 API 设计更具表达力

## 条件类型

条件类型类似于三元表达式，但运作在类型层面：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
```

### infer 关键字

`infer` 让我们从类型中提取信息：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

type Result = UnpackPromise<Promise<string>>; // string
```

## 映射类型

映射类型可以基于已有类型创建新类型：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 将所有属性变为可选且 nullable
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
```

## 模板字面量类型

这是 TypeScript 4.1 引入的强大特性：

```typescript
type EventType = "click" | "hover" | "focus";
type EventHandler = `on${Capitalize<EventType>}`;
// "onClick" | "onHover" | "onFocus"

// 获取对象中所有字符串值的键
type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
```

## 实战：类型安全的路由参数

```typescript
type ExtractParams<T extends string> = 
  T extends `${infer _Start}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
    : T extends `${infer _Start}/:${infer Param}`
      ? { [K in Param]: string }
      : {};

// 自动推断路由参数类型
const route = "/users/:userId/posts/:postId" as const;
type Params = ExtractParams<typeof route>;
// { userId: string; postId: string }
```

## 总结

TypeScript 高级类型的核心思想：

1. **条件类型** — 类型层面的 if/else
2. **infer** — 从类型中提取信息
3. **映射类型** — 批量转换类型成员
4. **模板字面量** — 字符串层面的类型操作

这些技巧组合起来，可以实现极其强大的类型安全抽象。
