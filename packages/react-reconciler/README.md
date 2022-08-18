## Reconciler

协调器的实现，即 React 的主要工作流程。与各 Renderer（渲染器）配合的方式是：

1. Reconciler 中统一从 hostConfig 模块引入宿主环境的方法

2. 不同渲染器在如下路径实现宿主环境方法： 自己的 package/src/hostConfig.ts

3. 默认情况下，reconciler 模块中引用的 hostConfig 指向的是 react-dom/src/hostConfig.ts（通过 ts paths）

4. 运行 demo 时（pnpm demo），通过 vite alias 将 hostConfig 指向 react-dom/src/hostConfig.ts

5. 打包时，不同宿主环境通过改变 rollup alias 就能打出 Reconciler + 自己宿主环境的包
