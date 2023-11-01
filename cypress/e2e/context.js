/**
 * @type SentenceContext
 */
const context = {
  parties: [],
  pageObjects: {
    header: {
      selector: '.component-header',
      children: {
        loginButton: '.login',
        welcomeMessage: '.login',
      },
    },
    searchInput: 'input[type="search"]',
    resultsCounter: '.count',
    resultList: {
      selector: '.component-emoji-results',
      children: {
        item: {
          selector: (index) =>
            `.component-emoji-result-row:nth-child(${index + 1})`,
          children: {
            title: '.title',
            emoji: 'img',
          },
        },
      },
    },
    loginScreen: {
      selector: '.login-screen',
      children: {
        loginInput: 'input[type="text"]',
        passwordInput: 'input[type="password"]',
        confirmButton: 'button',
      },
    },
  },
};

exports.default = context;
