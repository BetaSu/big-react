import {React, ReactDOM} from '../packages';

const {useState} = React;

function App({age}) {
  const [name, updateName] = useState('UZI');
  return (
    <div>
      <p>My name is {name}</p>
      <p>I am {age} years old.</p>
    </div>
  )
}
ReactDOM.render(<App age={18}/>, document.querySelector('#app'));