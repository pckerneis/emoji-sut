import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import EmojiResultRow from "./EmojiResultRow";
import "./EmojiResults.css";
import {getUserData, toggleFavorite} from './userData';

export default class EmojiResults extends PureComponent {
  static propTypes = {
    emojiData: PropTypes.array,
    totalCount: PropTypes.number,
    loggedUser: PropTypes.string,
  };

  componentDidMount() {
    this.state = {
      favorites: getUserData()[this.props.loggedUser] ?? [],
    }
  }

  componentWillUnmount() {
    this.clipboard.destroy();
  }

  render() {
    const favorites = getUserData()[this.props.loggedUser] ?? [];
    const doToggleFavorite = (symbol) => {
      this.setState({
        favorites: toggleFavorite(this.props.loggedUser, symbol)
      });
    };

    return (
      <div className="component-emoji-results">
        <span className="count">Showing {this.props.emojiData.length} out of {this.props.totalCount} results.</span>
        {this.props.emojiData.map(emojiData => (
          <EmojiResultRow
            key={emojiData.title}
            symbol={emojiData.symbol}
            title={emojiData.title}
            favorite={favorites.includes(emojiData.symbol)}
            loggedUser={this.props.loggedUser}
            toggleFavorite={() => doToggleFavorite(emojiData.symbol)}
          />
        ))}
      </div>
    );
  }
}
