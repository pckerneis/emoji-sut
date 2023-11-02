const Sentence = require('../../lib/mylib');
const cyAdapter = require('./cyAdapter');
const context = require('./context');

describe('Login/Logout', () => {
  it('should login', () => {
    const dsl = Sentence.given(context, cyAdapter);

    dsl
        .as('admin')
        .when.I.visit('http://localhost:3000')
        .and.I.clickOn().header.loginButton
        .then.loginScreen.isVisible()
        .when.I.typeInto.loginInput.my('username')
        .and.I.typeInto.passwordInput.my('password')
        .and.I.clickOn().confirmButton
        .then.loginScreen.doesNotExist()
        .and.header.welcomeMessage.hasText('Welcome, admin!');

    dsl
        .when.I.clickOn().header.welcomeMessage
        .then.loggedScreen.isVisible()
        .when.I.clickOn().logOutButton
        .then.loginScreen.doesNotExist()
        .and.header.welcomeMessage.doesNotExist();
  });
});
