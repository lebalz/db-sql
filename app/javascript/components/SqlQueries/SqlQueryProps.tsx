import React, { Fragment, SyntheticEvent } from 'react';
import { InputOnChangeData } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import SqlQuery from '../../models/SqlQuery';

interface Props {
  sqlQuery?: SqlQuery;
}

@observer
export default class SqlQueryProps extends React.Component<Props> {
  get selectedSqlQuery(): SqlQuery | undefined {
    return this.props.sqlQuery;
  }

  onChangeDescription = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    if (this.selectedSqlQuery) {
      this.selectedSqlQuery.description = data.value;
    }
  };

  render() {
    return (
      <Fragment>
        <div
          className={cx('description', {
            ['dirty-right']:
              this.selectedSqlQuery?.description !== this.selectedSqlQuery?.pristineState.description
          })}
        >
        </div>
      </Fragment>
    );
  }
}
