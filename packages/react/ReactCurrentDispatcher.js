// 保存当前的dispatcher引用，方便在多个模块间复用

// 由于首次渲染和再次更新时执行的hook（useXXX）函数不是同一个，
// 但是暴露给用户的hook（useXXX）应该始终是同一个函数
// 所以需要在合适的时机改变current的指向
// 这样用户调用同一个useXXX函数在 首次渲染/再次更新 时就能调用不同的函数了
const ReactCurrentDispatcher = {current: null};

export default ReactCurrentDispatcher;