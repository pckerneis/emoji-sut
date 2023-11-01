import React, { PureComponent } from "react";
import Header from "./Header";
import SearchInput from "./SearchInput";
import EmojiResults from "./EmojiResults";
import filterEmoji from "./filterEmoji";

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    const searchResult = filterEmoji("", 20);
    this.state = {
      filteredEmoji: searchResult.results,
      totalResults: searchResult.total
    };
  }

  handleSearchChange = event => {
    const searchResult = filterEmoji(event.target.value, 20);
    this.setState({
      filteredEmoji: searchResult.results,
      totalResults: searchResult.total,
    });
  };

  render() {
    return (
      <div>
        <Header />
        <SearchInput textChange={this.handleSearchChange} />
        <EmojiResults emojiData={this.state.filteredEmoji} totalCount={this.state.totalResults} />
      </div>
    );
  }
}
