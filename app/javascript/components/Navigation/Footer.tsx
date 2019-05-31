import React from 'react';
import DbSqlIcon from '../../shared/DbSqlIcon';

export default class Footer extends React.Component {
  render() {
    return (
      <footer>
        <div style={{ marginBottom: '0.4rem' }}>
          <DbSqlIcon size="small" />
        </div>
        <div style={{ marginRight: '2em' }}>
          <h3>DB SQL</h3>
        </div>
      </footer>
    );
  }
}
