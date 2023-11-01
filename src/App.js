import React, { PureComponent } from "react";
import Header from "./Header";
import SearchInput from "./SearchInput";
import EmojiResults from "./EmojiResults";
import filterEmoji from "./filterEmoji";
import LoginScreen from './LoginScreen';

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    const searchResult = filterEmoji("", 20);
    this.state = {
      filteredEmoji: searchResult.results,
      totalResults: searchResult.total,
      loginScreenVisible: false,
      loggedUser: null,
    };
  }

  showLoginScreen = () => {
    this.setState({
      loginScreenVisible: true,
    });
  }

  hideLoginScreen = () => {
    this.setState({
      loginScreenVisible: false,
    });
  }

  doLogin = (login) => {
    this.setState({
      loggedUser: login,
      loginScreenVisible: false,
    });
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
        <Header loggedUser={this.state.loggedUser} showLoginScreen={this.showLoginScreen} />
        <SearchInput textChange={this.handleSearchChange} />
        <EmojiResults emojiData={this.state.filteredEmoji} totalCount={this.state.totalResults}  loggedUser={this.state.loggedUser}/>
        {this.state.loginScreenVisible && (<LoginScreen doLogin={this.doLogin} hideLoginScreen={this.hideLoginScreen}/>)}
      </div>
    );
  }
}
