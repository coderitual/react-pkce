import React, { createContext, useState, useEffect, useContext } from 'react';
import authorize from './helpers/authorize';
import { getCodeFromLocation, getStateFromLocation } from './helpers/getDataFromLocation';
import { fetchToken } from './helpers/fetchToken';
import { removeCodeFromLocation } from './helpers/removeCodeFromLocation';
import { getVerifierFromStorage } from './helpers/getVerifierFromStorage';
import { removeVerifierFromStorage } from './helpers/removeVerifierFromStorage';
import { isClient } from './helpers/utils';
import logout from './helpers/logout';

export default ({
  clientId,
  clientSecret,
  provider,
  scopes = [],
  tokenEndpoint = `${provider}/token`,
  storage = sessionStorage,
  fetch = window.fetch,
  busyIndicator = <>logging in...</>,
}) => {
  const context = createContext({});
  const tokenkey = `at-${clientId}`;
  const { Provider } = context;

  class Authenticated extends React.Component {
    static contextType = context;
    componentDidMount() {
      const { ensureAuthenticated } = this.context;
      ensureAuthenticated(this.props.redirectUrl);
    }
    render() {
      const { token } = this.context;
      const { children } = this.props;

      if (!token || !isClient) {
        return busyIndicator;
      } else {
        return children;
      }
    }
  }

  const useToken = () => {
    const { token } = useContext(context);
    if (isClient) {
      console.warn(
        `Trying to useToken() while rendering on the server side.\nMake sure to useToken() only on client side.`
      );
    }
    return token;
  };

  const useAuthenticated = () => {
    if (!isClient) {
      return false;
    }
    const { token } = useContext(context);
    const code = getCodeFromLocation({ location: window.location });
    return token || code;
  };

  const useEndSession = () => {
    const { token } = useContext(context);
    return () => {
      if (!token) {
        return;
      }
      const { id_token } = token;
      logout({
        provider,
        id_token,
        tokenkey,
        storage,
      });
    };
  };

  return {
    AuthContext: ({ children }) => {
      const [token, setToken] = useState(null);

      useEffect(() => {
        if (isClient) {
          const token = storage.getItem(tokenkey);
          if (token) {
            setToken(JSON.parse(token));
          }
        }
      }, []);

      // if we have no token, but code and verifier are present,
      // then we try to swap code for token
      useEffect(() => {
        if (!token && isClient) {
          const code = getCodeFromLocation({ location: window.location });

          const verifier = getVerifierFromStorage({ clientId, storage });
          if (code && verifier) {
            fetchToken({
              clientId,
              clientSecret,
              tokenEndpoint,
              code,
              verifier,
              fetch,
            })
              .then((val) => {
                console.debug('We received: ', val);
                setToken(val);
                storage.setItem(tokenkey, JSON.stringify(val));
              })
              .then(() => {
                removeCodeFromLocation();
                removeVerifierFromStorage({ clientId, storage });
                const returnUrl = getStateFromLocation({ location: window.location });
                console.log('Return url:', returnUrl);
                debugger;
                if (returnUrl) {
                  console.log('Redirecting back to requested URL');
                  window.location.replace(returnUrl);
                }
              })
              .catch((e) => {
                console.error(e);
                alert(`Error fetching auth token: ${e.message}`);
              });
          }
        }
      }, []);

      const ensureAuthenticated = (redirectUrl) => {
        const code = getCodeFromLocation({ location: window.location });
        if (!token && !code) {
          authorize({ provider, clientId, scopes, redirectUrl });
        }
      };

      return <Provider value={{ token, ensureAuthenticated }}>{children}</Provider>;
    },
    Authenticated,
    useToken,
    useAuthenticated,
    useEndSession,
  };
};
