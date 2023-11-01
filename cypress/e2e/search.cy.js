const Sentence = require('../../lib/mylib');

const cyAdapter = {
  visit: (url) => {
    cy.visit(url);
  },
  select: (path) => {
    cy.log(`selecting ${path}`);
    const [root, ...rest] = path;
    return rest.reduce((acc, curr) => acc.find(curr), cy.get(root));
  },
};

describe('Search emojis', () => {
  it('search emojis', () => {
    Sentence.given({
      parties: [],
      pageObjects: {
        page: {
          selector: 'body',
          children: {
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
                    }
                  }
                }
              }
            },

          }
        }
      }
    }, cyAdapter)
        .when.I.visit('http://localhost:3000')
        .and.page.searchInput.isVisible.typeText('flower')
        .then.page.resultsCounter.hasText('Showing 10 out of 10 results.')
        .and.page.resultList.item(1).title.hasText('Hibiscus')
        .and.page.resultList.item(1).emoji.should('have.attr', 'src', '//cdn.jsdelivr.net/emojione/assets/png/1f33a.png')
  })
})