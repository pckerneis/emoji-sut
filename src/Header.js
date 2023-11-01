import React, { PureComponent } from "react";
import "./Header.css";
import PropTypes from 'prop-types';

export default class Header extends PureComponent {
  static propTypes = {
    loggedUser: PropTypes.string,
    showLoginScreen: PropTypes.func,
  };

  render() {
    const logged = this.props.loggedUser != null;
    return (
      <header className="component-header">
        <span className="title">Emoji Search</span>
        <div className="login">
          {logged
              && (<span onClick={this.props.showLoggedScreen}>Welcome, {this.props.loggedUser}!</span>)
              || (<span onClick={this.props.showLoginScreen}>Login</span>)}
        </div>
      </header>
    );
  }
}
