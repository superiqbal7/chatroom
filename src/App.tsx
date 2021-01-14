import React from 'react';
import logo from './logo.svg';
import './App.css';
// @ts-ignore
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import CreateRoom from './pages/CreateRoom';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID" component={CreateRoom} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
