# Didact
实现了 Concurrent Mode, Fiber Tree , Reconciliation, Function Component, Hook (useState) 的简易版React
## 名词解释
### Concurrent Mode

DOM树的渲染会阻塞主线程，造成用户交互卡顿。为了解决这个问题，引入`Concurrent Mode`的概念，当线程空闲的时候再处理DOM树的增删查改，执行工作的最小单位为`Fiber`。

### Fiber Tree

`Fiber`有2层含义。一是每个`Fiber`对应一个`React Element`，且有指向其父、子、右邻居`Fiber`的索引，他们共同组成一棵`Fiber`树，每次render的`React Element`会与上一次渲染所用的`Fiber`树比较，将变化部分渲染到DOM上。 另一个含义是每个`Fiber`是`Concurrent Mode`的一个最小工作单位(Unit Of Work)。也就是说渲染的优化力度可以控制到`React Element`这一级别。

### Reconciliation

首次渲染会直接根据`Fiber Tree`的结构渲染。再次渲染时会将要渲染的`React Element`与前一次渲染用的`Fiber Tree`比较，只对变化的部分进行DOM操作，提高渲染性能，这个过程叫`Reconciliation`
## 流程图
![image](https://raw.githubusercontent.com/BetaSu/didact/master/Preview.jpg)
