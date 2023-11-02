const Sentence = require('../../lib/mylib');
const cyAdapter = require('./cyAdapter');
const context = require('./context');

describe('Search emojis', () => {
  it('should search emojis', () => {
    Sentence.given(context, cyAdapter)
        .when.I.visit('http://localhost:3000')
        .then.searchInput.isVisible()
        .when.I.typeInto.it.text('flower')
        .then.resultsCounter.hasText('Showing 10 out of 10 results.')
        .and.resultList.item(1).title.hasText('Hibiscus')
        .and.resultList.item(1).emoji.should(
        'have.attr',
        'src',
        '//cdn.jsdelivr.net/emojione/assets/png/1f33a.png',
    );
  });
});
