import React from 'react';
import './App.scss';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import Menu from './Menu/Menu';
import Hero from './Hero/Hero';
import HomePage from './HomePage/HomePage';
import Footer from './Footer/Footer';
import AboutPage from './AboutPage/AboutPage';
import LoginPage from './LoginPage/LoginPage';
// import MyChart from './Chart/MyChart';

function App() {
  return (
    <Router>
      <Menu/>
      <Hero/>
      <div className="mainContainer">
        <Switch>
          <Route path="/about">
            <AboutPage/>
          </Route>
          <Route path="/login">
            <LoginPage/>
          </Route>
          <Route path="/">
            {/* <MyChart/> */}
            <HomePage/>
          </Route>          
        </Switch>
        {/* <MyChart/> */}
      </div>
      <Footer/>
    </Router>
  );
}

export default App;
