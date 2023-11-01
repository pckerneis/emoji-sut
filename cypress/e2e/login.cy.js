const Sentence = require('../../lib/mylib');
const cyAdapter = require('./cyAdapter');
const context = require('./context');

describe('Login/Logout', () => {
  it('should login', () => {
    Sentence.given(context, cyAdapter)
        .as('admin')
        .when.I.visit('http://localhost:3000')
        // TODO: .and.I.clickOn.header.loginButton
        .and.header.loginButton.click()
        .then.loginScreen.isVisible
        .when.loginInput.typeText('admin') // TODO: use party
        .and.passwordInput.typeText('password') // TODO: use party
        .and.confirmButton.click()
        .then.loginScreen.doesNotExist
        .and.header.welcomeMessage.hasText('Welcome, admin!')
  })
})