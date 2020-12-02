import * as React from 'react';
import { InsightProvider } from '@sevone/insight-connect';
import { LoadingCircle } from '@sevone/scratch';
import '@sevone/scratch/assets/theme.css';
import { defaultTheme } from './theme';

type Props = {
  arguments: {
    server: string,
    username: string,
    password: string,
    tenant: string
  },
  children: React.ReactNode
};

type State = {
  authToken: string | null
}

class Wrapper extends React.Component<Props, State> {
  state = {
    authToken: null
  };

  componentDidMount() {
    this.authenticate();
  }

  async authenticate() {
    const { server, username, password, tenant } = this.props.arguments;

    const body = {
      variables: {
        name: username,
        password,
        tenant
      },
      query: `
        mutation ($name: String!, $password: String!, $tenant: String) {
          authenticate(name: $name, password: $password, tenant: $tenant) {
            success
            token
          }
        }
      `
    };

    const { data } = await fetch(server, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then((response) => response.json());

    if (data && data.authenticate && data.authenticate.success) {
      this.setState({ authToken: data.authenticate.token });
    }
  }

  render() {
    const { children } = this.props;
    const { server } = this.props.arguments;
    const { authToken } = this.state;

    // Wait for us to fetch an auth token before we start the rest of the app
    if (!authToken) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LoadingCircle size="large" />
        </div>
      );
    }

    return (
      <InsightProvider basePath="/" serverUrl={server} authToken={authToken} theme={defaultTheme}>
        {children}
      </InsightProvider>
    );
  }
}

export default Wrapper;
