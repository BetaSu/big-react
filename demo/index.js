import {React, ReactDOM} from '../packages';

const {useState} = React;

function App({name}) {
  const [num, updateNum] = useState(1);
  setTimeout(() => {
    updateNum(num + 1);
  }, 2000);
  return (
    <ul>
      <li key={0}>0</li>
      {num % 2 ? <li key={1}>1</li> : null}
    </ul>
  )
}
ReactDOM.render(<App/>, document.querySelector('#app'));