export default () => {
  const a = new Uint32Array(8); // we want  32bit values
  return Array.from(window.crypto.getRandomValues(a))
    .map((i) => i.toString(16))
    .join('-');
};
