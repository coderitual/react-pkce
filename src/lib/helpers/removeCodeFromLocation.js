import { getStateFromLocation } from './getDataFromLocation';

export const removeCodeFromLocation = () => {
  const [base, search] = window.location.href.split('?');
  if (!search) {
    return;
  }
  const returnUrl = getStateFromLocation({ location: window.location });

  if (returnUrl) {
    window.location.replace(returnUrl);
    return;
  }

  const newSearch = search
    .split('&')
    .map((param) => param.split('='))
    .filter(([key]) => key !== 'code')
    .map((keyAndVal) => keyAndVal.join('='))
    .join('&');

  window.history.replaceState(
    window.history.state,
    null,
    base + (newSearch.length ? `?${newSearch}` : '')
  );
};
