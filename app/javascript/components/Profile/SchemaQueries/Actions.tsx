import React, { Fragment } from 'react';
import { Button, Popup } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import { SemanticSIZES } from 'semantic-ui-react/dist/commonjs/generic';

export enum ActionTypes {
  Save = 'save',
  Destroy = 'destroy',
  Discard = 'discard'
}

interface ActionableModel {
  isDirty: boolean;
  isPersisted: boolean;
  restore: () => void;
  save: () => void;
  destroy: () => void;
}

interface Props {
  for: ActionableModel;
  isSaving: boolean;
  actions?: ActionTypes[];
  disabled?: ActionTypes[];
  size?: SemanticSIZES;
  additionalActions?: React.ReactNode[];
}

@observer
export default class Actions extends React.Component<Props> {
  get actionableModel(): ActionableModel {
    return this.props.for;
  }

  get disabled() {
    return this.props.disabled ?? [];
  }

  get actions() {
    return this.props.actions ?? [];
  }

  render() {
    return (
      <div className="actions">
        <Popup
          on="click"
          position="top right"
          trigger={
            <Button
              disabled={this.disabled.includes(ActionTypes.Destroy)}
              icon="trash"
              labelPosition="left"
              content="Remove"
              color="red"
              size={this.props.size}
            />
          }
          header="Confirm"
          content={
            <Button
              icon="trash"
              labelPosition="left"
              content="Yes Delete"
              color="red"
              onClick={() => this.actionableModel?.destroy()}
              size={this.props.size}
            />
          }
        />
        <div className="spacer" />
        {this.actionableModel.isDirty && this.actionableModel.isPersisted && (
          <Button
            icon="cancel"
            labelPosition="left"
            content="Cancel"
            color="black"
            size={this.props.size}
            onClick={() => this.actionableModel.restore()}
            disabled={this.disabled.includes(ActionTypes.Discard)}
          />
        )}
        {this.props.additionalActions &&
          this.props.additionalActions.map((action, idx) => <Fragment key={idx}>{action}</Fragment>)}
        <Button
          icon="save"
          labelPosition="left"
          color="green"
          loading={this.props.isSaving}
          disabled={!this.actionableModel.isDirty || this.disabled.includes(ActionTypes.Save)}
          style={{ marginRight: 0 }}
          onClick={() => this.actionableModel?.save()}
          content="Save"
          size={this.props.size}
        />
      </div>
    );
  }
}
