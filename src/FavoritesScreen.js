import React from 'react';
import './FavoritesScreen.css';

export default function FavoritesScreen(props) {
  const buildSrc = (symbol) => {
    const codePointHex = symbol.codePointAt(0).toString(16);
    return `//cdn.jsdelivr.net/emojione/assets/png/${codePointHex}.png`;
  };
  return (
      <div className="favorites-screen" onClick={props.hideFavoritesScreen}>
        <div className="container" onClick={e => e.stopPropagation()}>
          <div className="title">Your favorites</div>
          <div className="count">
            {props.favorites.length === 0
                ? <span>You don't have any favorite emoji yet.</span>
                : <span>You have {props.favorites.length} favorite Emojis.</span>}

          </div>
          <div className="favorites">
            {props.favorites.map(favorite => (
                <div key={favorite} className="favorite">
                  <img alt={favorite} src={buildSrc(favorite)} />
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}
