# 介绍

`Scheduler`模块通过`setTimeout`+`Message Event`实现`requestIdleCallback`API polyfill，达到在线程空闲时异步执行任务的需求。

<a href="https://github.com/facebook/react/pull/14234">PR：将window.postMessage替换成了MessageChannel</a>

该模块在React更新时变动较大，但整体架构不变。当前实现基于React V16.13.1对应的Scheduler。

如果你使用`create-react-app`创建项目，`Scheduler`代码目录见
```
node_modules/scheduler/cjs/scheduler.development.js
```

## 流程简介

`Scheduler`内部存在2个优先队列，优先队列的实现使用<a href="https://spground.github.io/2017/07/07/Heap%20and%20Heap's%20Application-Heap%20Sort%20and%20Priority%20Queue/">小顶堆</a>实现。

- timerQueue
- taskQueue

`timerQueue`保存不用立即执行的延迟任务，当延迟任务到了他的执行时间会从`timerQueue`中取出并推入`taskQueue`中

`taskQueue`保存任务`startTime` > `currentTime`的任务，这部分任务是需要被执行的

## 方法简介

### scheduleCallback

方法简介：

`requestIdleCallback` polyfill，`Scheduler`暴露的主要方法

步骤简介：

传入任务优先级，回调，额外配置后，创建新任务，并根据任务的`startTime`判断

- startTime > currentTime，新任务有延迟，将其加入`timerQueue`，调用`requestHostTimeout`

- startTime <= currentTime，新任务没有延迟，将其加入`taskQueue`，如果此时没有任务正在被调度，则调用`requestHostCallback`

### requestHostTimeout

方法简介：

将延迟的任务中到了任务开始时间的任务放入任务队列

步骤简介：

会在任务`startTime` - 当前时间`currentTime`后调用`handleTimeout`。

`handleTimeout`内部会遍历`timerQueue`，将`startTime`<`currentTime`的任务取出并放入`taskQueue`。

并判断

- 当前没有进入调度执行阶段，且`taskQueue`中有任务，则调用`requestHostCallback`调度该任务
- 当前没有进入调度执行阶段，但是`taskQueue`为空，表示没有可调度任务。如果此时`timerQueue`中存在任务，则递归`requestHostTimeout`。

### requestHostCallback

方法简介：

通过`Message Event`在下一次JS线程进入`marcoTask`阶段执行任务回调。
