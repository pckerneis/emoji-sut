import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import "./EmojiResultRow.css";

export default class EmojiResultsRow extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    symbol: PropTypes.string
  };

  render() {
    const codePointHex = this.props.symbol.codePointAt(0).toString(16);
    const src = `//cdn.jsdelivr.net/emojione/assets/png/${codePointHex}.png`;
    return (
        <div className="component-emoji-result-row">
          <span className="favorite">⭐</span>
          <img alt={this.props.title} src={src} />
          <span className="title">{this.props.title}</span>
          <span className="info">Click to add to favorites</span>
        </div>
    );
  }
}
