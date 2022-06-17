import { REACT_ELEMENT_TYPE } from "shared";

const ReactElement = function (type, key, ref, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    key,
    ref,
    props,
  };

  return element;
};
