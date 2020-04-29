import ReactCurrentDispatcher from './ReactCurrentDispatcher';

// 这个函数建立了链接用户调用的hook（useXXX）和实际执行的hook（useXXX）的链接
// 具体解释见ReactCurrentDispatcher
function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}