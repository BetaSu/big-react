import ReactRoot from './ReactRoot';
import * as DOMRenderer from 'reactReconciler';

const ReactDOM = {
  // 第三个参数 callback 未实现
  render(element, container) {
    const root = container._reactRootContainer = new ReactRoot(container);

    // 首次渲染不需要批处理
    DOMRenderer.unbatchedUpdates(() => {
      root.render(element);
    })
  }
}

export default ReactDOM;