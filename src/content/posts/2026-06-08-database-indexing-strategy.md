---
title: "数据库索引优化实战策略"
date: 2026-06-08
category: "后端技术"
tags: ["数据库","SQL","后端"]
description: "B+树索引原理、覆盖索引、联合索引最左前缀原则——让你的数据库查询快 100 倍。"
coverEmoji: "🗄️"
draft: false
---

## 为什么需要索引

数据库索引就像书的目录——没有目录，你要逐页翻找；有了目录，直接定位到对应页码。

```sql
-- 无索引：全表扫描，100万行需要扫描100万次
SELECT * FROM users WHERE email = 'test@example.com';

-- 有索引：B+树查找，100万行只需约20次比较
CREATE INDEX idx_email ON users(email);
```

## B+树索引原理

B+树是大多数数据库索引的底层数据结构：

```
         [30 | 60]              ← 根节点
        /    |      [10|20] [40|50] [70|80]      ← 中间节点
  /      /      /    5  10  20 30 40 50 60 70 80   ← 叶子节点（存储数据指针）
```

### 为什么用 B+树而不是 B 树

- **叶子节点存储所有数据** — 范围查询高效
- **非叶子节点只存索引** — 每个节点能存更多键，树更矮
- **叶子节点互相链接** — 顺序访问无需回溯

## 联合索引与最左前缀

```sql
-- 创建联合索引
CREATE INDEX idx_name_age_city ON users(last_name, age, city);

-- ✅ 可以使用索引
SELECT * FROM users WHERE last_name = '张';
SELECT * FROM users WHERE last_name = '张' AND age = 25;
SELECT * FROM users WHERE last_name = '张' AND age = 25 AND city = '北京';

-- ❌ 无法使用索引
SELECT * FROM users WHERE age = 25;
SELECT * FROM users WHERE city = '北京';

-- ⚠️ 部分使用索引
SELECT * FROM users WHERE last_name = '张' AND city = '北京';
-- 只能用到 last_name 部分
```

### 口诀

> 最左前缀原则：索引从最左列开始匹配，遇到范围查询会停止。

```sql
-- 范围查询后的列无法使用索引
SELECT * FROM users 
WHERE last_name = '张' AND age > 25 AND city = '北京';
-- city 无法使用索引，因为 age 是范围查询
```

## 覆盖索引

如果一个索引包含了查询所需的所有字段，就称为覆盖索引：

```sql
-- 创建包含查询字段的索引
CREATE INDEX idx_covering ON users(last_name, age, email);

-- 这个查询只需要访问索引，不需要回表
SELECT last_name, age, email FROM users WHERE last_name = '张';

-- EXPLAIN 结果中 Extra 列会显示 "Using index"
```

覆盖索引避免了回表操作，性能提升显著。

## 索引失效的场景

### 1. 对索引列使用函数

```sql
-- ❌ 索引失效
SELECT * FROM users WHERE YEAR(created_at) = 2026;

-- ✅ 改为范围查询
SELECT * FROM users 
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';
```

### 2. 隐式类型转换

```sql
-- ❌ 如果 phone 是 VARCHAR，但传入数字，索引失效
SELECT * FROM users WHERE phone = 13800138000;

-- ✅ 使用字符串
SELECT * FROM users WHERE phone = '13800138000';
```

### 3. LIKE 以 % 开头

```sql
-- ❌ 索引失效
SELECT * FROM users WHERE name LIKE '%张';

-- ✅ 可以使用索引
SELECT * FROM users WHERE name LIKE '张%';
```

### 4. OR 条件

```sql
-- ❌ 如果 name 有索引但 age 没有，索引失效
SELECT * FROM users WHERE name = '张三' OR age = 25;

-- ✅ 两个字段都有索引时可以使用
-- 或者拆分为 UNION
SELECT * FROM users WHERE name = '张三'
UNION
SELECT * FROM users WHERE age = 25;
```

## 实战优化案例

### 案例：分页查询优化

```sql
-- ❌ 深分页，OFFSET 越大越慢
SELECT * FROM articles ORDER BY created_at DESC LIMIT 100000, 20;

-- ✅ 使用游标分页（延迟关联）
SELECT a.* FROM articles a
INNER JOIN (
  SELECT id FROM articles ORDER BY created_at DESC LIMIT 100000, 20
) t ON a.id = t.id;

-- ✅✅ 最佳方案：基于游标的分页
SELECT * FROM articles 
WHERE created_at < '2026-06-08 10:00:00'
ORDER BY created_at DESC LIMIT 20;
```

## 索引不是银弹

### 索引的代价

| 代价 | 说明 |
|------|------|
| **存储空间** | 每个索引占用额外磁盘 |
| **写入变慢** | INSERT/UPDATE/DELETE 需要维护索引 |
| **优化器负担** | 索引太多，优化器选择困难 |

### 索引原则

1. **查询频繁的字段加索引** — 写多读少的表少加
2. **区分度高的字段优先** — 性别不适合，邮箱适合
3. **联合索引优于单列索引** — 减少索引数量
4. **定期清理无用索引** — 用 `pt-index-usage` 分析

## 总结

数据库索引优化的核心：

- **理解 B+树** — 才能理解索引如何工作
- **最左前缀** — 联合索引的基础规则
- **覆盖索引** — 消除回表的利器
- **避免索引失效** — 函数、类型转换、LIKE 前缀

好的索引策略，能让你的数据库从"勉强能用"变成"飞一般的感觉"。
