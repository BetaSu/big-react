// 涉及DOM的相关配置

const CHILDREN = 'children';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

function setTextContent(node, text) {
  let firstChild = node.firstChild;
  if (
    firstChild &&
    firstChild === node.lastChild &&
    firstChild.nodeType === TEXT_NODE
  ) {
    firstChild.nodeValue = text;
  } else {
    node.textContent = text;
  }
}

export function shouldSetTextContent(type, props) {
  const children = props.children;
  return (
    type === 'noscript' ||
    type === 'textarea' ||
    type === 'option' ||
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

function setInitialDOMProperties(domElement, tag, nextProps) {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];

    if (propKey === CHILDREN) {
      if (typeof nextProp === 'string' && nextProp) {
        setTextContent(domElement, nextProp);
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp);
      }
    } else if (nextProp !== null) {
      // setValueForProperty
    }
  }
}

// 初始化DOM属性
// TODO HostComponent attribute、事件初始化
export function finalizeInitialChildren(domElement, type, props) {
  setInitialDOMProperties(domElement, type, props);
}

export function insertInContainerBefore(container, child, beforeChild) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

export function appendChildToContainer(container, child) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, container);
  } else {
    container.appendChild(child);
  }
}