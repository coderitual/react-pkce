import hashed from './hashed'

export default function logout({
  provider,
  id_token,
  tokenkey,
  storage = sessionStorage
}) {

  const query = {
    redirect_uri: window.location,
    id_token_hint: id_token,
  }
  storage.removeItem(tokenkey);
  
  const url = `${ provider }/authorize?${ hashed(query) }`
  window.location.replace(url)
}
