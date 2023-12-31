import React, { PureComponent } from 'react';
import Header from './Header';
import SearchInput from './SearchInput';
import EmojiResults from './EmojiResults';
import filterEmoji from './filterEmoji';
import LoginScreen from './LoginScreen';
import LoggedScreen from './LoggedScreen';
import { getUserData, toggleFavorite } from './userData';
import FavoritesScreen from './FavoritesScreen';

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    const searchResult = filterEmoji('', 20);
    this.state = {
      filteredEmoji: searchResult.results,
      totalResults: searchResult.total,
      loginScreenVisible: false,
      loggedScreenVisible: false,
      favoritesScreenVisible: false,
      loggedUser: null,
      favorites: [],
    };
  }

  showLoginScreen = () => {
    this.setState({
      loginScreenVisible: true,
    });
  };

  hideLoginScreen = () => {
    this.setState({
      loginScreenVisible: false,
    });
  };

  showLoggedScreen = () => {
    this.setState({
      loggedScreenVisible: true,
    });
  };

  hideLoggedScreen = () => {
    this.setState({
      loggedScreenVisible: false,
    });
  };

  showFavoritesScreen = () => {
    this.setState({
      favoritesScreenVisible: true,
      loginScreenVisible: false,
      loggedScreenVisible: false,
    });
  };

  hideFavoritesScreen = () => {
    this.setState({
      favoritesScreenVisible: false,
    });
  };

  doLogin = (login) => {
    this.setState({
      loggedUser: login,
      loginScreenVisible: false,
      favorites: getUserData()[login] ?? [],
    });
  };

  doLogout = () => {
    this.setState({
      loggedUser: null,
      loggedScreenVisible: false,
      favorites: [],
    });
  };

  handleSearchChange = (event) => {
    const searchResult = filterEmoji(event.target.value, 20);
    this.setState({
      filteredEmoji: searchResult.results,
      totalResults: searchResult.total,
    });
  };

  doToggleFavorite = (symbol) => {
    if (this.state.loggedUser == null) {
      this.setState({
        loginScreenVisible: true,
      });
    } else {
      this.setState({
        favorites: toggleFavorite(this.state.loggedUser, symbol),
      });
    }
  };

  render() {
    return (
      <div>
        <Header
          loggedUser={this.state.loggedUser}
          showLoginScreen={this.showLoginScreen}
          showLoggedScreen={this.showLoggedScreen}
        />
        <SearchInput textChange={this.handleSearchChange} />
        <EmojiResults
          emojiData={this.state.filteredEmoji}
          totalCount={this.state.totalResults}
          loggedUser={this.state.loggedUser}
          favorites={this.state.favorites}
          doToggleFavorite={this.doToggleFavorite}
        />
        {this.state.loginScreenVisible && (
          <LoginScreen
            doLogin={this.doLogin}
            hideLoginScreen={this.hideLoginScreen}
          />
        )}
        {this.state.loggedScreenVisible && (
          <LoggedScreen
            doLogout={this.doLogout}
            hideLoggedScreen={this.hideLoggedScreen}
            showFavoritesScreen={this.showFavoritesScreen}
          />
        )}
        {this.state.favoritesScreenVisible && (
          <FavoritesScreen
            favorites={this.state.favorites}
            hideFavoritesScreen={this.hideFavoritesScreen}
          />
        )}
      </div>
    );
  }
}
