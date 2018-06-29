import React from 'react'
import Home from './Home'
import {Switch, Route, BrowserRouter} from 'react-router-dom';
import TimeSlotHome from "./TimeSlots";

class App extends React.Component {

  render() {
    return (
        <BrowserRouter>
            <div>
                <Switch>
                    <Route path='/signup' component={Home}/>
                    <Route path='/apptgroups/:apptGroupId' component={TimeSlotHome}/>
                    <Route render={function(){
                        return <p>Not Found</p>
                    }}/>
                </Switch>
            </div>
        </BrowserRouter>
    );
  }
}

export default App;
