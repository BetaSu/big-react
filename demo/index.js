import {React, ReactDOM} from '../packages';

const {useState} = React;

function App({name}) {
  const [num, updateNum] = useState(0);
  setTimeout(() => {
    updateNum(num + 1);
  }, 2000);
  return (
    <div>
      <p>{num}</p>
    </div>
  )
}
ReactDOM.render(<App/>, document.querySelector('#app'));