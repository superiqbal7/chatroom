import React from "react";
import "./App.css";
// @ts-ignore
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import ChatRoom from "./pages/ChatRoom";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/" component={ChatRoom} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
