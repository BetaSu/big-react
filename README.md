<p align="center"><img src="https://p3.ssl.qhimg.com/t0154d29702a432306d.png" alt="React-On-The-Way"></p>

# React-On-The-Way
基于React`V16.13.1`架构，从零实现React 🎉🎉🎉

# 配套教程
<a href="https://react.iamkasong.com/">React技术揭秘</a>

👋👋👋 文章有任何不清楚的地方，欢迎给我提PR

## 为什么会有这个仓库？

我假设React是你日常开发的框架，在日复一日的开发中，你萌生了学习React源码的念头，在网上搜各种源码解析后，你发现这些教程可以分为2类：

1. 《xx行代码带你实现迷你React》，《xx行代码实现React hook》这样短小精干的文章。如果你只是想花一点点时间了解下React的工作原理，我向你推荐 <a href="https://pomb.us/build-your-own-react/">这篇文章</a>，非常精彩。同时，这个仓库可能不适合你，因为他会花掉你很多时间。

2. 《React Fiber原理》，《React expirationTime原理》这样摘录React源码讲解的文章。如果你想学习React源码，当你都不知道`Fiber`是什么，不知道`expirationTime`对于React的意义时，这样的文章会给人“你讲解的代码我看懂了，但这些代码的作用是什么”的感觉。

这个仓库的存在就是为了解决这个问题。

简单来说，这个仓库有对应的一系列文章，文章会讲解React为什么要这么做，以及大体怎么做，但不会有大段的代码告诉你怎么做。

当你看完文章知道我们要做什么后，再来看仓库中具体的代码实现。

同时为了防止堆砌过多功能后，代码量太大影响你理解某个功能的实现，我为每个功能的实现打上一个`git tag`。

## 历史版本预览
通过切换`git tag`浏览不同完成度的项目，执行`npm start`启动该版本下的Demo

### 当前版本v6
<a href="https://github.com/BetaSu/react-on-the-way/compare/v5...BetaSu:v6" target="_blank">v6 diff v5</a>

v6实现了React的异步调度器<a href="https://github.com/BetaSu/react-on-the-way/tree/87ea94cb03889d8d9f82c91eea992e2153b397bb/packages/scheduler">Scheduler</a>（也就是说我们实现了`requestIdleCallback` polyfill），并使用`Scheduler`实现了异步render，也就是<a href="https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html">React ConcurrentMode</a>。

之前的版本中，我们都是同步执行render流程。在v6中，我们会为产生的`update`赋予一个优先级，高优先级的`update`会优先进入render流程。甚至当低优先级的`update`在render过程中我们触发了高优先级`update`，这时会搁置低优先级render转而处理高优先级render，这很酷，不是么😄

相对应的，v6相对v5增加了大量代码和一些全局变量。不过没关系，我会在之后的文章介绍这一切是如何做到的。新增功能如下：

1. Scheduler模块
2. fiber的优先级冒泡机制
3. ConcurrentMode

这真是React内部最复杂的机制了，让人头秃👨‍🦲

### v5
<a href="https://github.com/BetaSu/react-on-the-way/compare/v4...BetaSu:v5" target="_blank">v5 diff v4</a>

在v3中我们实现了状态更新，直接在`FunctionComponent`函数体内触发更新会造成死循环，所以我们用计时器来触发。在业务中，我们一般是通过：

1. 回调函数（ex：onClick）
2. `useEffect hook`
3. `ClassComponent`生命周期钩子

来触发。既然我们已经实现了`useState hook`，这一版我们就实现`useEffect hook`，新增功能如下：

- [x] `useEffect hook`首屏及再次渲染的完整逻辑

### v4
<a href="https://github.com/BetaSu/react-on-the-way/compare/v3...BetaSu:v4" target="_blank">v4 diff v3</a>

之前只能更新单一节点，这次实现了大名鼎鼎的React Diff算法，可以更新多个兄弟子节点了😄，新增功能如下：
- [x] 节点支持`key`prop
- [x] `commit`流程支持`Deletion effectTag`处理
- [x] `reconcileChildrenArray`支持非首次渲染的diff算法

ps：支持`Deletion effectTag`处理是为了应对：

```javascript
// 首屏渲染的组件
[a, b, c] 
// 再次渲染的组件
[a, null, c] 
```
在这种情况下b fiber被标记为`Deletion effectTag`，对应的DOM节点需要删除

### v3
<a href="https://github.com/BetaSu/react-on-the-way/compare/v2...BetaSu:v3" target="_blank">v3 diff v2</a>

之前的版本只实现了首屏渲染的逻辑，即使在v2中实现了`useState`也只实现了`useState(initialValue)`带来的首屏渲染，在v3中我们终于实现状态更新啦，撒花🎉，新增功能如下：
- [x] `useState hook`对单一`HostComponent`的状态更新

ps：之所以只支持单一`HostComponent`，是因为还没有实现`key`以及`diff`算法，所以无法支持多个兄弟组件的更新

🐛当一个组件中使用多个`useState hook`且他们的更新函数同时触发，如示例中：

```javascript
// 会造成页面逐渐卡顿并最终崩溃的例子
function App({name}) {
  const [even, updateEven] = useState(0);
  const [odd, updateOdd] = useState(1);

  setTimeout(() => {
    updateEven(even + 2);
    updateOdd(odd + 2);  
  }, 2000);
  
  return (
    <ul>
      <li key={0}>{even}</li>
      <li key={1}>{odd}</li>
    </ul>
  )
}

```
react-on-the-way会造成页面逐渐卡顿并最终崩溃。原因是`updateEven`和`updateOdd`方法会分别开始一次新的更新流程。

在其中每次更新流程执行到`updateFunctionComponent`时会调用`App`函数，在函数内部会调用计时器并在2000ms后又调用这2个更新函数，从而又开启新的更新流程。更新流程的数量会指数增加并最终崩溃。

造成这个问题的原因是我们还没有实现React的任务优先级机制与任务的批处理。在React中，

- 同步模式下同一个事件函数内的同步更新会被批处理，只产生一次更新流程
- 异步模式下所有更新都会经过优先级调度

### v2
<a href="https://github.com/BetaSu/react-on-the-way/compare/v1...BetaSu:v2" target="_blank">v2 diff v1</a>

为了实现React的页面更新逻辑，需要改变状态（state），我们有2条路可选：

1. 实现`ClassComopnent setState`
2. 实现`FunctionComopnent useState`

考虑`hook`是React的趋势，我们优先实现`useState`，所以v2我们在第一版基础上增加了`FunctionComponent`相关首屏渲染，新增功能如下：
- [x] `FunctionComponent`类型组件的首屏渲染
- [x] `hook`架构体系
- [x] `useState hook`首屏渲染做的工作

### v1
我们的首要目标是实现React的页面更新逻辑，基于这个目标，我们首先实现了`HostComponent`的首屏渲染，新增功能如下：
- [x] Render-Commit整体架构体系
- [x] `HostComponent`的首屏渲染

🙋‍♂️小讲堂：`HostComponent`是指原生DOM组件对应的JSX，在React执行时产生的组件
```jsx
// 比如这样
<div>Hello</div>
```
