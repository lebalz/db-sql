import React, { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import SessionStore, { ApiRequestState } from '../stores/session_store';
import { Message, Dimmer, Loader } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import { RouteComponentProps } from 'react-router';
import { activateAccount } from '../api/user';
import { Link } from 'react-router-dom';
import { computed } from 'mobx';

interface MatchParams {
  id: string;
}
interface ResetPasswordProps extends RouteComponentProps<MatchParams> {}

interface InjectedProps extends ResetPasswordProps {
  sessionStore: SessionStore;
  routerStore: RouterStore;
}

@inject('sessionStore', 'routerStore')
@observer
export default class ActivateAccount extends React.Component<ResetPasswordProps> {
  state = {
    requestState: ApiRequestState.None,
    errorMsg: ''
  };

  componentDidMount() {
    this.setState({ requestState: ApiRequestState.Waiting });
    activateAccount(this.id, this.activationToken)
      .then(() => {
        this.setState({ requestState: ApiRequestState.Success });
        if (this.injected.sessionStore.isLoggedIn) {
          if (this.injected.sessionStore.authorize(this.props.location.pathname)) {
            this.injected.sessionStore.reloadUser();
          }
        }
      })
      .catch((error) => {
        this.setState({
          requestState: ApiRequestState.Error,
          errorMsg: error.response.data.error || 'Unexpected server error'
        });
      });
  }

  get injected() {
    return this.props as InjectedProps;
  }

  get id() {
    return this.props.match.params.id;
  }

  get activationToken() {
    return this.queryParams.get('activation_token') || '';
  }

  get queryParams() {
    return new URLSearchParams(this.props.location.search);
  }

  @computed
  get backLink() {
    if (this.injected.sessionStore.isLoggedIn) {
      return '/dashboard';
    }
    return '/login';
  }

  render() {
    return (
      <main
        className="fullscreen"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexDirection: 'column'
        }}
      >
        <div>
          <Dimmer active={this.state.requestState === ApiRequestState.Waiting}>
            <Loader indeterminate>Activating Account</Loader>
          </Dimmer>
          <DbSqlIcon size="large" />
          {this.state.requestState === ApiRequestState.Success && (
            <Fragment>
              <Message success content="Account successfully activated." />
              <Link to={this.backLink}>Back to DB-SQL</Link>
            </Fragment>
          )}
          {this.state.requestState === ApiRequestState.Error && (
            <Fragment>
              <Message error content={this.state.errorMsg} />
              <Link to={this.backLink}>Back to DB-SQL</Link>
            </Fragment>
          )}
        </div>
      </main>
    );
  }
}
