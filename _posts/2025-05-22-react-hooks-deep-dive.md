---
layout: post
title: "React Hooks深度解析：从useEffect的闭包陷阱到自定义Hook的最佳实践"
date: 2025-05-22 18:00:00 +0800
categories: [技术实战, React]
tags: [代码产品]
image: /assets/images/react-hooks-cover.jpg
---

React Hooks已经发布5年多了，但我在Code Review中还是经常看到一些典型错误。今天我想深入聊聊几个最容易踩坑的地方，以及如何避免它们。

## useEffect的闭包陷阱

这是最常见的问题。看这段代码：

```jsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Current count:', count);
      setCount(count + 1);  // 问题在这里
    }, 1000);

    return () => clearInterval(timer);
  }, []);  // 空依赖数组

  return <div>Count: {count}</div>;
}
```

你觉得这个计数器能正常工作吗？

答案是：**不能**。它只会从0增加到1，然后停止。

原因：useEffect的回调在组件挂载时执行，此时count的值是0。setInterval的回调形成了闭包，永远引用着count=0。所以每次setCount(count + 1)实际上都是setCount(0 + 1)。

### 解决方案1：使用函数式更新

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1);  // 使用函数式更新
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

setCount接收一个函数，React会传入最新的state值。这样就不依赖闭包中的count了。

### 解决方案2：正确设置依赖

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Current count:', count);
    setCount(count + 1);
  }, 1000);

  return () => clearInterval(timer);
}, [count]);  // 添加count到依赖数组
```

这样每次count变化都会重新设置定时器。但会带来新的问题：定时器被频繁重置。如果间隔是1秒，实际效果可能是不到1秒就触发一次。

### 解决方案3：使用useRef（推荐）

```jsx
import { useState, useEffect, useRef } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持ref与state同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Current count:', countRef.current);
      setCount(countRef.current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>Count: {count}</div>;
}
```

useRef返回的对象在组件整个生命周期内保持不变。通过ref可以访问到最新的值，同时不触发重新渲染。

## 自定义Hook的设计原则

自定义Hook是React中复用逻辑的主要方式。但写不好的Hook比不用还糟糕。

### 一个完整的自定义Hook示例

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';

// 通用的异步数据获取Hook
function useAsyncData(fetchFn, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fetchFnRef = useRef(fetchFn);

  // 保持fetchFn引用最新
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async (...params) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFnRef.current(...params);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
}

// 使用示例
function UserProfile({ userId }) {
  const fetchUser = useCallback(
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    [userId]
  );

  const { data: user, loading, error } = useAsyncData(fetchUser);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

这个Hook的设计要点：

1. **返回对象而不是数组**：对象解构时顺序不重要，更灵活
2. **提供手动执行方法**：execute允许在事件触发时重新获取数据
3. **提供setData方法**：允许调用者直接修改数据（如乐观更新）
4. **使用useCallback缓存execute**：防止不必要的重新创建
5. **使用useRef保持fetchFn最新**：避免闭包问题

### 另一个实用Hook：useLocalStorage

```jsx
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  // 初始化时从localStorage读取
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 返回一个包装后的setter，自动同步到localStorage
  const setStoredValue = useCallback((newValue) => {
    try {
      const valueToStore = newValue instanceof Function 
        ? newValue(value) 
        : newValue;
      
      setValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  // 监听其他标签页的修改
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  // 提供删除方法
  const removeValue = useCallback(() => {
    try {
      setValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [value, setStoredValue, removeValue];
}

// 使用示例
function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <button onClick={removeTheme}>Reset to Default</button>
    </div>
  );
}
```

这个Hook的亮点：

1. **支持函数式更新**：setStoredValue可以接收函数
2. **SSR安全**：检查typeof window避免服务端渲染报错
3. **跨标签页同步**：监听storage事件，一个标签页修改，其他标签页自动更新
4. **错误处理**：JSON解析和localStorage操作都有try-catch

## useMemo和useCallback的正确使用

很多人滥用这两个Hook。记住一个原则：**先测量，再优化**。

```jsx
// 不要这样做
const value = useMemo(() => a + b, [a, b]);  // 简单计算不需要memo

// 这样做
const value = useMemo(() => {
  return heavyComputation(a, b);  // 只有真正昂贵的计算才需要
}, [a, b]);
```

useCallback也是同理：

```jsx
// 不要这样做
const handleClick = useCallback(() => {
  console.log('clicked');  // 简单回调不需要memo
}, []);

// 这样做
const handleSubmit = useCallback((data) => {
  api.submitForm(data).then(setResult);  // 传递给子组件的回调
}, []);
```

### 一个实用的性能优化Hook

```jsx
import { useRef, useEffect } from 'react';

// 用于追踪组件渲染次数和原因
function useRenderTracer(componentName) {
  const renderCount = useRef(0);
  const prevProps = useRef(null);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[${componentName}] Render #${renderCount.current}`);
    
    if (prevProps.current) {
      // 比较哪些props变化了
      const changedProps = Object.entries(prevProps.current)
        .filter(([key, val]) => val !== prevProps.current[key])
        .map(([key]) => key);
      
      if (changedProps.length > 0) {
        console.log(`  Changed props:`, changedProps);
      }
    }
  });

  return renderCount.current;
}

// 使用示例
function ExpensiveComponent({ data, onUpdate }) {
  useRenderTracer('ExpensiveComponent');
  
  // 组件逻辑...
  return <div>{/* ... */}</div>;
}
```

这个Hook在开发环境很有用，可以帮助你找到不必要的重新渲染。

## 总结

React Hooks看似简单，但要写出高质量的代码需要理解其背后的原理。关键要点：

1. **闭包是useEffect的大敌**：使用函数式更新或useRef来避免
2. **依赖数组要诚实**：不要撒谎，React会知道
3. **自定义Hook要设计好API**：返回对象更灵活，提供完整的控制方法
4. **不要过早优化**：useMemo和useCallback有成本，只在需要时用

Hooks让函数组件拥有了类组件的能力，同时保持了更好的可组合性。掌握这些模式，你的React代码质量会有明显提升。
