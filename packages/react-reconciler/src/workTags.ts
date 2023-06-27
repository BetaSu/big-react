export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment
	| typeof SuspenseComponent
	| typeof LazyComponent
	| typeof OffscreenComponent;

export const FunctionComponent = 0;
export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const SuspenseComponent = 13;
export const LazyComponent = 16;
export const OffscreenComponent = 22;

// "ReferenceError: Cannot access 'current2' before initialization
//     at completeWork (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/completeWork.ts?t=1687782804329:88:7)
//     at completeUnitOfWork (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/workLoop.ts?t=1687782804329:288:18)
//     at performUnitOfWork (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/workLoop.ts?t=1687782804329:280:5)
//     at workLoopSync (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/workLoop.ts?t=1687782804329:268:5)
//     at renderRoot (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/workLoop.ts?t=1687782804329:163:48)
//     at performSyncWorkOnRoot (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/workLoop.ts?t=1687782804329:185:22)
//     at http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/syncTaskQueue.ts:14:39
//     at Array.forEach (<anonymous>)
//     at flushSyncCallbacks (http://localhost:5173/@fs/Users/bytedance/projects/big-react/packages/react-reconciler/src/syncTaskQueue.ts:14:17)"