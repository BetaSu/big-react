/** 
 * @description V1版，实现了 ReactDOM.render
*/

const render = (vnode, container) => {
  container.ap
}

const createDOM = vnode => {
  const dom = vnode.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
  return dom;
}

const createTextElement = nodeValue => ({
  type: 'TEXT_ELEMENT',
  props: {
    nodeValue,
    children: []
  }
})

const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  }
}

export const ReactDOM = {
  render
}

export const React = {
  createElement
}
