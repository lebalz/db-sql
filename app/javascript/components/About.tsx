import React, { Fragment } from 'react';
import { Header, Button } from 'semantic-ui-react';
import NavBar from './Navigation/NavBar';
import { observer } from 'mobx-react';
import DbSqlIcon from '../shared/DbSqlIcon';

@observer
export default class About extends React.Component {
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
              <Button icon="github" as="a" href="https://github.com/lebalz/db-sql" content="GitHub" />
              <Button icon="star" as="a" href="https://github.com/lebalz/db-sql" content="Star" />
              <Button
                icon="eye"
                as="a"
                href="https://github.com/lebalz/db-sql/subscription"
                content="Watch"
              />
              <Button
                icon="exclamation circle"
                as="a"
                href="https://github.com/lebalz/db-sql/issues"
                content="Issues"
              />
              <Button
                icon="balance"
                as="a"
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                content="GPLv3"
              />
            </div>
        </main>
      </Fragment>
    );
  }
}