import React, { Fragment, SyntheticEvent } from 'react';
import { Input, InputOnChangeData, TextAreaProps, TextArea } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { computed } from 'mobx';
import Group from '../../../models/Group';

interface Props {
  group: Group;
  isReadonly?: boolean;
}

@observer
export default class GroupProps extends React.Component<Props> {

  @computed
  get group() {
    return this.props.group;
  }

  onChangeName = (event: SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
    event.preventDefault();
    if (this.group) {
      this.group.name = data.value;
    }
  };

  onChangeDescription = (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) => {
    event.preventDefault();
    if (this.group) {
      this.group.description = data.value?.toString() ?? '';
    }
  };


  render() {
    return (
      <Fragment>
        <div
          className={cx('name', {
            ['dirty-right']: this.group.name !== this.group.pristineState.name
          })}
        >
          <Input
            value={this.group.name ?? ''}
            onChange={this.onChangeName}
            disabled={!this.group.isAdmin || this.props.isReadonly}
            placeholder="Group Name..."
          />
        </div>
        <div
          className={cx('description', {
            ['dirty-right']: this.group.description !== this.group.pristineState.description
          })}
        >
          <TextArea
            value={this.group.description ?? ''}
            onChange={this.onChangeDescription}
            rows={Math.max(this.group.description?.split('\n').length ?? 0, 2)}
            disabled={!this.group.isAdmin || this.props.isReadonly}
            placeholder="Description..."
          />
        </div>
      </Fragment>
    );
  }
}
