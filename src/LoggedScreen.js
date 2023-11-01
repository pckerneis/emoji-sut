import React from 'react';
import './LoggedScreen.css';

export default function LoggedScreen(props) {
  return (
      <div className="logged-screen" onClick={props.hideLoggedScreen}>
        <div className="container" onClick={e => e.stopPropagation()}>
          <div onClick={props.showFavoritesScreen} className="link">Show my favorites</div>
          <div onClick={props.doLogout} className="link">Log out</div>
        </div>
      </div>
  );
}
