// 涉及DOM的相关配置

export function shouldSetTextContent(type, props) {
  const children = props.children;
  return (
    type === 'noscript' ||
    type === 'textarea' ||
    tyep === 'option' ||
    typeof children === 'string' ||
    typeof children === 'number'
  )
}

export function createInstance(type, props) {
  const domElement = createElement(type, props);
  return domElement;
}

export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

export function createTextInstance(text) {
  return document.createTextNode(text);
}

// 创建DOM节点
// TODO 根据 根节点的namespace创建DOM节点，不一定 创建在当前document里
export function createElement(type, props) {
  let domElement;
  if (type === 'script') {
    // 通过innerHTML的方式生成的script标签内部脚本不会执行
    const div = document.createElement('div');
    div.innerHTML = '<script></script>';
    domElement = div.removeChild(div.firstChild);
  } else {
    domElement = document.createElement(type);
  }
  return domElement;
}