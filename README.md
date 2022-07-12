# Big-React

从零实现 React v18 🎉🎉🎉

没什么比自己亲手造个`React18`更能加深理解的了

## TODO List

### 工程类需求

| 类型 | 内容                               | 完成情况 | 在哪个版本实现的                                  |
| ---- | ---------------------------------- | -------- | ------------------------------------------------- |
| 架构 | monorepo（pnpm 实现）              | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 规范 | eslint                             | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 规范 | prettier                           | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 规范 | commitlint + husky                 | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 规范 | lint-staged                        | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 规范 | tsc                                | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 测试 | jest 环境搭建                      | ✅       | [v4](https://github.com/BetaSu/big-react/tree/v4) |
| 规范 | tsc                                | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 构建 | babel 配置                         | ✅       | [v4](https://github.com/BetaSu/big-react/tree/v4) |
| 构建 | Dev 环境包的构建                   | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| 构建 | Prod 环境包的构建                  | ⬜️      |                                                   |
| 部署 | Github Action 执行 lint 与 test    | ⬜️      |                                                   |
| 部署 | Github Action 根据 tag 发布 npm 包 | ⬜️      |                                                   |

### 框架需求

当前跑通 React 官方测试用例 17 个

| 类型       | 内容                        | 完成情况 | 在哪个版本实现的                                  |
| ---------- | --------------------------- | -------- | ------------------------------------------------- |
| React      | JSX 转换                    | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| React      | React.isValidElement        | ✅       | [v4](https://github.com/BetaSu/big-react/tree/v4) |
| ReactDOM   | 浏览器环境 DOM 的插入       | ✅       | [v2](https://github.com/BetaSu/big-react/tree/v2) |
| ReactDOM   | 浏览器环境 DOM 的移动       | ⬜️      |                                                   |
| ReactDOM   | 浏览器环境 DOM 的属性变化   | ⬜️      |                                                   |
| ReactDOM   | 浏览器环境 DOM 的删除       | ⬜️      |                                                   |
| ReactDOM   | ReactTestUtils              | ✅       | [v4](https://github.com/BetaSu/big-react/tree/v4) |
| ReactNoop  | ReactNoop Renderer          | ⬜️      |                                                   |
| Reconciler | Fiber 架构                  | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| Reconciler | 事件模型                    | ⬜️      |                                                   |
| Reconciler | Lane 模型                   | ⬜️      |                                                   |
| Reconciler | 基础 Update 机制            | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| Reconciler | 带优先级的 Update 机制      | ⬜️      |                                                   |
| Reconciler | 插入单节点的 reconcile 流程 | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| Reconciler | 插入多节点的 reconcile 流程 | ⬜️      |                                                   |
| Reconciler | 删除节点的 reconcile 流程   | ⬜️      |                                                   |
| Reconciler | HostText 类型支持           | ✅       | [v2](https://github.com/BetaSu/big-react/tree/v2) |
| Reconciler | HostComponent 类型支持      | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| Reconciler | HostRoot 类型支持           | ✅       | [v1](https://github.com/BetaSu/big-react/tree/v1) |
| Reconciler | FunctionComponent 类型支持  | ✅       | [v3](https://github.com/BetaSu/big-react/tree/v3) |
| React      | Hooks 架构 mount 时实现     | ✅       | [v3](https://github.com/BetaSu/big-react/tree/v3) |
| React      | Hooks 架构 update 时实现    | ⬜️      |                                                   |
| Reconciler | useState 实现               | ✅       | [v3](https://github.com/BetaSu/big-react/tree/v3) |
| Reconciler | useEffect 实现              | ⬜️      |                                                   |
| Reconciler | useRef 实现                 | ⬜️      |                                                   |
| Reconciler | 同步调度流程                | ⬜️      |                                                   |
| Reconciler | 异步调度流程                | ⬜️      |                                                   |

## 调试

主要调试方式包括两个：

1. 跑`React`官方的测试用例

执行`pnpm test`

2. pnpm link

通过`CRA`或`Vite`起一个`React`测试项目后，在本项目执行`pnpm run build:dev`打包`react`与`react-dom`，在测试项目中通过`pnpm link`将项目依赖的`react`与`react-dom`替换为我们打包的`react`与`react-dom`

## 更新日志

### [v4](https://github.com/BetaSu/big-react/tree/v4)

初始化测试相关架构，包括如下功能：

- 实现 React.isValidElement
- jest 环境搭建
- babel 配置
- ReactTestUtils
- 跑通关于 jsx 的 17 个官方用例

### [v3](https://github.com/BetaSu/big-react/tree/v3)

实现 useState 的 mount 时流程，包括如下功能：

- FunctionComponent 类型支持
- Hooks 架构 mount 时实现
- useState 实现

### [v2](https://github.com/BetaSu/big-react/tree/v2)

插入单节点的 mount 流程（可以在浏览器环境渲染 DOM），包括如下功能：

- 浏览器环境 DOM 的插入
- HostText 类型支持

### [v1](https://github.com/BetaSu/big-react/tree/v1)

插入单节点的 render 阶段 mount 流程，包括如下功能：

- JSX 转换
- Fiber 架构
- 插入单节点的 reconcile 流程
- HostComponent 类型支持
- HostRoot 类型支持

注：还未实现浏览器环境下的渲染
