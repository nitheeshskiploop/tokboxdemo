/* Let CRA handle linting for sample app */
import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import './App.css';
import TokClient from './tokclient';
import TokWeb from './tokWeb';

class App extends Component {


  render() {
    return (
      <Router>
        <div>
        <Route path="/" exact component={TokClient} />
        <Route path="/web" component={TokWeb} />
        </div>
    </Router>
    );
  }
}

export default App;
