const getDataFromLocation = (dataKey, { location }) => {
  const split = location.toString().split('?');
  if (split.length < 2) {
    return null;
  }
  const pairs = split[1].split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key === dataKey) {
      return decodeURIComponent(value || '');
    }
  }
  return null;
};

export const getCodeFromLocation = ({ location }) => {
  return getDataFromLocation('code');
};

export const getStateFromLocation = ({ location }) => {
  return getDataFromLocation('state');
};
