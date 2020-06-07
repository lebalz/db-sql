import React, { Fragment, SyntheticEvent } from 'react';
import { TextArea, Input, InputOnChangeData, TextAreaProps } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import SchemaQuery from '../../../models/SchemaQuery';
import cx from 'classnames';

interface Props {
  schemaQuery?: SchemaQuery;
}

@observer
export default class SchemaQueryProps extends React.Component<Props> {
  get selectedSchemaQuery(): SchemaQuery | undefined {
    return this.props.schemaQuery;
  }
  onChangeName = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    if (this.selectedSchemaQuery) {
      this.selectedSchemaQuery.name = data.value;
    }
  };

  onChangeDescription = (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) => {
    event.preventDefault();
    if (this.selectedSchemaQuery) {
      this.selectedSchemaQuery.description = data.value?.toString() ?? '';
    }
  };

  render() {
    return (
      <Fragment>
        <div
          className={cx('schema-name', {
            ['dirty-right']: this.selectedSchemaQuery?.name !== this.selectedSchemaQuery?.pristineState.name
          })}
        >
          <Input
            value={this.selectedSchemaQuery?.name ?? ''}
            onChange={this.onChangeName}
            disabled={!this.selectedSchemaQuery?.canEdit}
            placeholder="Title..."
          />
        </div>
        <div
          className={cx('schema-description', {
            ['dirty-right']:
              this.selectedSchemaQuery?.description !== this.selectedSchemaQuery?.pristineState.description
          })}
        >
          <TextArea
            value={this.selectedSchemaQuery?.description ?? ''}
            onChange={this.onChangeDescription}
            rows={Math.max(this.selectedSchemaQuery?.description?.split('\n').length ?? 0, 2)}
            disabled={!this.selectedSchemaQuery?.canEdit}
            placeholder="Description..."
          />
        </div>
      </Fragment>
    );
  }
}
