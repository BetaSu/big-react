import {React, ReactDOM} from '../packages';

const {useState} = React;

function App({name}) {
  const [num, updateNum] = useState(0);
  setTimeout(() => {
    updateNum(num + 1);
  }, 2000);
  return (
    <div>
      <p>{name}:{num}</p>
    </div>
  )
}
ReactDOM.render(<App name='状态更新demo'/>, document.querySelector('#app'));