import React, { createContext, useState, useEffect, useContext } from 'react';
import authorize from './helpers/authorize';
import { getCodeFromLocation } from './helpers/getCodeFromLocation';
import { fetchToken } from './helpers/fetchToken';
import { removeCodeFromLocation } from './helpers/removeCodeFromLocation';
import { getVerifierFromStorage } from './helpers/getVerifierFromStorage';
import { removeVerifierFromStorage } from './helpers/removeVerifierFromStorage';
import { isClient } from './helpers/utils';

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
  const { Provider } = context;

  class Authenticated extends React.Component {
    static contextType = context;
    componentDidMount() {
      const { ensureAuthenticated } = this.context;
      ensureAuthenticated();
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
        `Trying to useToken() while rendering on the server side.\nMake sure to useToken() only on client side.`,
      );
    }
    if (!token) {
      console.warn(
        `Trying to useToken() while not being authenticated.\nMake sure to useToken() only inside of an <Authenticated /> component.`,
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
    return token && code;
  };

  return {
    AuthContext: ({ children }) => {
      const [token, setToken] = useState(null);

      const tokenkey = `at-${clientId}`;

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
              .then(setToken)
              .then(() => {
                removeCodeFromLocation();
                removeVerifierFromStorage({ clientId, storage });
                storage.setItem(tokenkey, JSON.stringify(token));
              })
              .catch((e) => {
                console.error(e);
                alert(`Error fetching auth token: ${e.message}`);
              });
          }
        }
      }, [token]);

      const ensureAuthenticated = () => {
        const code = getCodeFromLocation({ location: window.location });
        if (!token && !code) {
          authorize({ provider, clientId, scopes });
        }
      };

      return <Provider value={{ token, ensureAuthenticated }}>{children}</Provider>;
    },
    Authenticated,
    useToken,
    useAuthenticated,
  };
};
