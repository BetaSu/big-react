import {React, ReactDOM} from '../packages';

function App({name}) {
  return (
    <div>my name is {name}</div>
  )
}
ReactDOM.render(<App name="UZI" />, document.querySelector('#app'));