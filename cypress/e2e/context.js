/**
 * @type SentenceContext
 */
const context = {
  parties: [],
  pageObjects: {
    header: {
      selector: '.component-header',
      children: {
        loginButton: {
          selector: '.login',
        },
        welcomeMessage: {
          selector: '.login',
        }
      }
    },
    searchInput: {
      selector: 'input[type="search"]',
    },
    resultsCounter: {
      selector: '.count',
    },
    resultList: {
      selector: '.component-emoji-results',
      children: {
        item: {
          selector: (index) => `.component-emoji-result-row:nth-child(${index + 1})`,
          children: {
            title: {
              selector: '.title',
            },
            emoji: {
              selector: 'img',
            },
          },
        },
      },
    },
    loginScreen: {
      selector: '.login-screen',
      children: {
        loginInput: {
          selector: 'input[type="text"]',
        },
        passwordInput: {
          selector: 'input[type="password"]',
        },
        confirmButton: {
          selector: 'button',
        }
      }
    }
  },
};

exports.default = context;
