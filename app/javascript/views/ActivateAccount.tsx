import React, { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import SessionStore, { RequestState } from '../stores/session_store';
import { Header, Form, Message, Dimmer, Loader } from 'semantic-ui-react';
import { RouterStore } from 'mobx-react-router';
import DbSqlIcon from '../shared/DbSqlIcon';
import { RouteComponentProps } from 'react-router';
import { resetPassword as resetPasswordCall, activateAccount } from '../api/user';
import { Link } from 'react-router-dom';

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
    requestState: RequestState.None,
    errorMsg: '',
  };

  componentDidMount() {
    this.setState({ requestState: RequestState.Waiting });
    activateAccount(this.id, this.activationToken)
      .then(() => {
        this.setState({ requestState: RequestState.Success });
      })
      .catch((error) => {
        this.setState({
          requestState: RequestState.Error,
          errorMsg: error.response.data.error || 'Unexpected server error',
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

  render() {
    return (
      <main
        className="fullscreen"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexDirection: 'column',
        }}
      >
        <div>
          <Dimmer active={this.state.requestState === RequestState.Waiting}>
            <Loader indeterminate>Activating Account</Loader>
          </Dimmer>
          <DbSqlIcon size="large" />
          {this.state.requestState === RequestState.Success && (
            <Fragment>
              <Message success content="Account successfully activated." />
              <Link to="/login">Back to DB-SQL</Link>
            </Fragment>
          )}
          {this.state.requestState === RequestState.Error && (
            <Fragment>
              <Message error content={this.state.errorMsg} />
              <Link to="/login">Back to DB-SQL</Link>
            </Fragment>
          )}
        </div>
      </main>
    );
  }
}
