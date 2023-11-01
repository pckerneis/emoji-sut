const userDataKey = 'userData';

export function getUserData() {
  const item = localStorage.getItem(userDataKey);
  return item ? JSON.parse(item) : {};
}

export function toggleFavorite(user, emoji) {
  if (user == null) {
    return [];
  }

  const item = getUserData(userDataKey);

  if (item[user] == null) {
    item[user] = [];
  }

  if (! item[user].includes(emoji)) {
    item[user].push(emoji);
  } else {
    item[user] = item[user].filter(e => e !== emoji);
  }

  localStorage.setItem(userDataKey, JSON.stringify(item));
  return item[user];
}