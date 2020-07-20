import React, { Fragment, SyntheticEvent } from 'react';
import { InputOnChangeData } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import SqlQuery from '../../models/SqlQuery';

interface Props {
  sqlQuery?: SqlQuery;
}

@observer
export default class SqlQueryProps extends React.Component<Props> {
  get selectedSqlQuery(): SqlQuery | undefined {
    return this.props.sqlQuery;
  }

  render() {
    return (
      <Fragment>
        <div className="description"></div>
      </Fragment>
    );
  }
}
