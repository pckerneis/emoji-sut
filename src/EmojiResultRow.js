import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './EmojiResultRow.css';

export default class EmojiResultsRow extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    symbol: PropTypes.string,
    favorite: PropTypes.bool,
    loggedUser: PropTypes.string,
    toggleFavorite: PropTypes.func,
  };

  constructor() {
    super();
  }

  render() {
    const codePointHex = this.props.symbol.codePointAt(0).toString(16);
    const src = `//cdn.jsdelivr.net/emojione/assets/png/${codePointHex}.png`;
    const favClass = this.props.favorite ? 'favorite' : 'favorite hidden';
    const favText = this.props.favorite
      ? 'Click to remove from favorites'
      : 'Click to add to favorites';

    return (
      <div
        className="component-emoji-result-row"
        onClick={this.props.toggleFavorite}
      >
        <span className={favClass}>⭐</span>
        <img alt={this.props.title} src={src} />
        <span className="title">{this.props.title}</span>
        <span className="info">{favText}</span>
      </div>
    );
  }
}
