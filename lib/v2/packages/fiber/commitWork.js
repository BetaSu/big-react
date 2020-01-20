export function commitDFS(effects) {
  Renderer.batchedUpdates(function () {
      var el;
      while ((el = effects.shift())) {
          //处理retry组件
          if (el.effectTag === DETACH && el.caughtError) {
              disposeFiber(el);
          } else {
              commitDFSImpl(el);
          }
          if (passiveFibers.length) {
              passiveFibers.forEach(function (fiber) {
                  safeInvokeHooks(fiber.updateQueue, 'passive', 'unpassive');
              });
              passiveFibers.length = 0;
          }
          if (domRemoved.length) {
              domRemoved.forEach(Renderer.removeElement);
              domRemoved.length = 0;
          }
      }
  }, {});

  let error = Renderer.catchError;
  if (error) {
      delete Renderer.catchError;
      throw error;
  }
}