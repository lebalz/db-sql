import * as React from "react";

class DbSql extends React.Component {
  render () {
    return (
      <React.Fragment>
        <h1>DB SQL</h1>
        <p>{(new Date()).toLocaleString('de-CH')}</p>
      </React.Fragment>
    );
  }
}

export default DbSql
