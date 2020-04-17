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

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
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

export function insertBefore(container, child, beforeChild) {
  container.insertBefore(child, beforeChild);
}

export function appendChild(container, child) {
  container.appendChild(child);
}

// diff oldProps 与 newProps 更新HostComponent
// TODO 除了children以外其他props的更新
export function diffProperties(domElement, type, oldProps, newProps) {
  let propKey;
  let updatePayload;
  // TODO oldProps不存在的情况
  // 这种情况下 children 的处理我们在协调时已经做了

  // newProp存在的情况
  for (propKey in newProps) {
    const newProp = newProps[propKey];
    const oldProp = oldProps ? oldProps[propKey] : undefined;
    if (
      !newProps.hasOwnProperty(propKey) ||
      oldProp === newProp ||
      (!oldProp && !newProp)
    ) {
      continue;
    }
    if (propKey === CHILDREN) {
      if (typeof newProp === 'number' || typeof newProp === 'string') {
        (updatePayload = updatePayload || []).push(propKey, '' + newProp);
      }
    }
  }
  return updatePayload;
}

// 当前处理了 children textNode
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    }
  }
}

export function commitUpdate(domElement, updatePayload) {
  // TODO 调用updateProperties，内部再调用updateDOMProperties
  updateDOMProperties(domElement, updatePayload);
}