import {React, ReactDOM} from '../packages';

const {useState, useEffect} = React;

function App({name}) {
  const [even, updateEven] = useState(0);
  const [odd, updateOdd] = useState(1);

  useEffect(() => {
    document.title = `${name} ${even}`;
  }, [even])

  setTimeout(() => {
    updateEven(even + 2);
    updateOdd(odd + 2);  
  }, 2000);
  
  return (
    <ul>
      <li key={0}>{even}</li>
      {/* {even % 4 ? null : <li>可以被4整除</li>} */}
      <li key={1}>{odd}</li>
      {/* {odd % 3 ? null : <li>可以被3整除</li>} */}
      {213} {'2323'} 2323
    </ul>
  )
}

ReactDOM.render(<App name="Hello"/>, document.querySelector('#app'));