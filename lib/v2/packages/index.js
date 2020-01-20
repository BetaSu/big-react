/** 
 * @description V1版，实现了 ReactDOM.render
*/
import {Fiber} from './fiber/Fiber';
import {renderer} from './core/renderer';
import './fiber/scheduleWork';

export function render(vnode, root) {
  // let container = createContainer(root);
  
  renderer.macrotasks.push(vnode);
}

const createTextElement = nodeValue => ({
  type: 'TEXT_ELEMENT',
  props: {
    nodeValue,
    children: []
  }
})

export const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  }
}

// export const render = (vnode, container) => {
//   const dom = createDOM(vnode);
//   const isProperty = key => key !== "children";
//   Object.keys(vnode.props)
//     .filter(isProperty)
//     .forEach(name => {
//       dom[name] = vnode.props[name];
//     });
//   vnode.props.children.forEach(child => render(child, dom));
//   container.appendChild(dom);
// }

// const createDOM = vnode => {
//   const dom = vnode.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(vnode.type);
//   return dom;
// }

export const ReactDOM = {
  render
}

export const React = {
  createElement
}
