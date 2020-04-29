# React-On-The-Way
基于React`V16.13.1`架构，从零实现React，相关配套文章

- <a href="https://juejin.im/post/5e9abf06e51d454702460bf6">🔥从0实现React 📖PART1 React的架构设计</a>

## 历史版本预览
通过切换`git tag`浏览不同完成度的项目，执行`npm start`启动该版本下的Demo

### 当前版本v5
实现了`useEffect hook`，新增功能如下：
- [x] useEffect hook

### v4
之前只能协调单一节点，这次实现了大名鼎鼎的React Diff算法，可以协调多个子节点了😄，新增功能如下：
- [x] 节点支持`key`prop
- [x] commit流程支持`Deletion effectTag`处理
- [x] `reconcileChildrenArray`支持非首次渲染的diff算法

### v3
终于实现状态更新啦，撒花🎉，新增功能如下：
- [x] `useState hook`对单一`HostComponent`的状态更新

ps：之所以只支持单一`HostComponent`，是因为还没有实现`key`以及`diff`算法

### v2
在第一版基础上增加了FunctionComponent相关首屏渲染，新增功能如下：
- [x] `FunctionComponent`类型组件的首屏渲染
- [x] `useState hook`首屏渲染

### v1
第一个可运行版本，该版本完成了React的Render-Commit整体架构体系，新增功能如下：
- [x] `HostComponent`的首屏渲染