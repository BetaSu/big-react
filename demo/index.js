import {React, ReactDOM} from '../packages';

const {useState, useEffect} = React;
let stop = Date.now() + 1000 * 30;
function App({name}) {
  const [even, updateEven] = useState(0);
  
  useEffect(() => {
    document.title = even;
  }, [even])

  setTimeout(() => {
    if (Date.now() - stop > 0) {
      return;
    }
    updateEven(even + 2);
  }, 2000);
  return (
    <ul>
      <li key={0}>{even}</li>
    </ul>
  )
}
ReactDOM.render(<App/>, document.querySelector('#app'));