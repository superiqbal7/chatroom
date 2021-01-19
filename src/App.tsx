import React from "react";
import logo from "./logo.svg";
import "./App.css";
// @ts-ignore
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import CreateRoom from "./pages/CreateRoom";
import ChatRoom from "./pages/ChatRoom";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/room/" exact component={CreateRoom} />
          <Route path="/" component={ChatRoom} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
