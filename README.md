<img src="https://p5.ssl.qhimg.com/t01d24827719d254d97.png" alt="React-On-The-Way" width="100%">

# React-On-The-Way
基于React`V16.13.1`架构，从零实现React，相关配套文章

- <a href="https://juejin.im/post/5e9abf06e51d454702460bf6">🔥从0实现React 📖PART1 React的架构设计</a>

## 历史版本预览
通过切换`git tag`浏览不同完成度的项目，执行`npm start`启动该版本下的Demo

### 当前版本v5
实现了`useEffect hook`，新增功能如下：
- [x] `useEffect hook`首屏及再次渲染的完整逻辑

### v4
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
之前的版本只实现了首屏渲染的逻辑，即使在v2中实现了`useState`也只实现了`useState(initialValue)`带来的首屏渲染，在v3中我们终于实现状态更新啦，撒花🎉，新增功能如下：
- [x] `useState hook`对单一`HostComponent`的状态更新

ps：之所以只支持单一`HostComponent`，是因为还没有实现`key`以及`diff`算法，所以无法支持多个兄弟组件的更新

### v2
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
