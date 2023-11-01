import React, { PureComponent } from "react";
import "./LoginScreen.css";

export default class LoginScreen extends PureComponent {
  render() {
    return (
      <div className="login-screen" onClick={this.props.hideLoginScreen}>
        <div className="container">
          <div className="login-form">
            <label>Login</label>
            <input type="text" />
            <label>Password</label>
            <input type="password" />
          </div>
          <button>Login</button>
        </div>
      </div>
    );
  }
}
