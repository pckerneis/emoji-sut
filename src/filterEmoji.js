import emojiList from './emojiList.json';

export default function filterEmoji(searchText, maxResults) {
  const results = emojiList.filter((emoji) => {
    if (emoji.title.toLowerCase().includes(searchText.toLowerCase())) {
      return true;
    }

    return emoji.keywords.includes(searchText);
  });

  return {
    results: results.slice(0, maxResults),
    total: results.length,
  };
}
