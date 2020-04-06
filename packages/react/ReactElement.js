import {
  REACT_ELEMENT_TYPE
} from 'shared/ReactSymbols';

function ReactElement(type, key, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    props
  }
}
/** 
 * @description React.createElement
*/
export const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  } 
}

export function createElement(type, config, children) {
  const props = {};
  if (config) {
    for (propName in config) {
      if (hasOwnProperty.call(config, propName)) {
        props[propName] = config[propName];
      }
    }
    const childrenLength = arguments.length - 2;
    // 多个children使用数组的形式
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      const childArray = Array(childrenLength);
      for (let i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[2 + i];
      }
      props.children = childArray;
    }
  }
  return ReactElement(type, null, props);
}