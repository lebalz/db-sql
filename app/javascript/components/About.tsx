import React, { Fragment } from 'react';
import { Header, Button } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import { observer, inject } from 'mobx-react';
import DbSqlIcon from '../shared/DbSqlIcon';
import StatusStore from '../stores/status_store';

interface InjectedProps {
  statusStore: StatusStore;
}

@inject('statusStore')
@observer
export default class About extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }
  render() {
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
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
            <DbSqlIcon size="massive" />
            <Header as="h1" textAlign="center" style={{ marginTop: '40px' }}>
              DB SQL
            </Header>
          </div>
          <div>
            <div className="further-info">
              <Button
                icon="github"
                target="_blank"
                as="a"
                href="https://github.com/lebalz/db-sql"
                content="GitHub"
              />
              <Button
                icon="star"
                target="_blank"
                as="a"
                href="https://github.com/lebalz/db-sql"
                content="Star"
              />
              <Button
                icon="eye"
                as="a"
                target="_blank"
                href="https://github.com/lebalz/db-sql/subscription"
                content="Watch"
              />
              <Button
                icon="exclamation circle"
                as="a"
                target="_blank"
                href="https://github.com/lebalz/db-sql/issues"
                content="Issues"
              />
            </div>
            <div className="further-info">
              <Button
                icon="code branch"
                as="a"
                target="_blank"
                href={this.injected.statusStore.commit.link}
                content={`v${this.injected.statusStore.commit.commit}`}
              />

              <Button
                icon="balance"
                as="a"
                target="_blank"
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                content="GPLv3"
              />
            </div>
          </div>
        </main>
      </Fragment>
    );
  }
}
