import React from 'react';

import EmojiResultRow from './EmojiResultRow';
import './EmojiResults.css';

export default function EmojiResults(props) {
  return (
    <div className="component-emoji-results">
      <span className="count">
        Showing {props.emojiData.length} out of {props.totalCount} results.
      </span>
      {props.emojiData.map((emojiData) => (
        <EmojiResultRow
          key={emojiData.title}
          symbol={emojiData.symbol}
          title={emojiData.title}
          favorite={props.favorites.includes(emojiData.symbol)}
          loggedUser={props.loggedUser}
          toggleFavorite={() => props.doToggleFavorite(emojiData.symbol)}
        />
      ))}
    </div>
  );
}
