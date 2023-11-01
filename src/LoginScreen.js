import React, { useState } from 'react';
import './LoginScreen.css';

export default function LoginScreen(props) {
  const [login, setLogin] = useState();
  const [password, setPassword] = useState();

  const doLogin = () => {
    if (login) {
      props.doLogin(login);
    }
  };

  return (
    <div className="login-screen" onClick={props.hideLoginScreen}>
      <div className="container" onClick={(e) => e.stopPropagation()}>
        <div className="login-form">
          <label>Login</label>
          <input type="text" onChange={(e) => setLogin(e.target.value)} />
          <label>Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button onClick={doLogin}>Login</button>
      </div>
    </div>
  );
}
