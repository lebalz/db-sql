import React from 'react';
import { Button, Popup } from 'semantic-ui-react';
import SchemaQuery from '../../../models/SchemaQuery';
import cx from 'classnames';
import { observer } from 'mobx-react';

interface Props {
  schemaQuery: SchemaQuery;
  isSaving: boolean;
}

@observer
export default class Actions extends React.Component<Props> {
  get selectedSchemaQuery(): SchemaQuery {
    return this.props.schemaQuery;
  }

  render() {
    return (
      <div className="actions">
        {this.selectedSchemaQuery.isDirty && this.selectedSchemaQuery.isPersisted && (
          <Button
            icon="cancel"
            labelPosition="left"
            content="Cancel"
            color="black"
            onClick={() => this.selectedSchemaQuery?.restore()}
          />
        )}
        <Button
          className={cx('toggle-privacy', {
            ['dirty']:
              this.selectedSchemaQuery.isPrivate !== this.selectedSchemaQuery.pristineState.is_private
          })}
          icon={this.selectedSchemaQuery.isPrivate ? 'lock' : 'lock open'}
          labelPosition="left"
          color="yellow"
          disabled={
            !this.selectedSchemaQuery?.canEdit ||
            (this.selectedSchemaQuery.isPublic && this.selectedSchemaQuery.stats.public_user_count > 0)
          }
          onClick={() => this.selectedSchemaQuery?.togglePrivacy()}
          content={this.selectedSchemaQuery.isPrivate ? 'Private' : 'Public'}
        />

        <Popup
          on="click"
          position="top right"
          trigger={
            <Button
              disabled={
                !this.selectedSchemaQuery?.canEdit || this.selectedSchemaQuery.stats.public_user_count > 0
              }
              icon="trash"
              labelPosition="left"
              content="Remove"
              color="red"
            />
          }
          header="Confirm"
          content={
            <Button
              icon="trash"
              labelPosition="left"
              content="Yes Delete"
              color="red"
              onClick={() => this.selectedSchemaQuery?.destroy()}
            />
          }
        />
        <Button
          icon="save"
          labelPosition="left"
          color="green"
          loading={this.props.isSaving}
          disabled={!this.selectedSchemaQuery.isDirty}
          style={{ marginRight: 0 }}
          onClick={() => this.selectedSchemaQuery?.save()}
          content="Save"
        />
      </div>
    );
  }
}
