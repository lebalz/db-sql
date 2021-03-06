import React, { Fragment } from 'react';
import { Icon, List, Loader } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import RouterStore from '../../../stores/router_store';

interface PlaceholderItemProps {
  dbName: string;
  dbServerId: string;
  isLoading?: boolean;
}

interface InjectedDbItemPorps extends PlaceholderItemProps {
  routerStore: RouterStore;
}

@inject('routerStore')
@observer
export default class PlaceholderItem extends React.Component<PlaceholderItemProps> {
  state = { loading: false };
  get injected() {
    return this.props as InjectedDbItemPorps;
  }

  get link() {
    const { dbName, dbServerId } = this.props;
    return `/connections/${dbServerId}/${dbName}`;
  }

  render() {
    const { dbName, isLoading } = this.props;
    return (
      <Fragment>
        <List.Item
          as="a"
          data-dbname={dbName}
          className="database-item"
          onClick={() => {
            this.setState({ loading: true });
            this.injected.routerStore.push(this.link);
          }}
        >
          <List.Content>
            <div style={{ display: 'flex' }}>
              <Icon fitted name="database" color="grey" />
              <span style={{ marginLeft: '10px' }}>{dbName}</span>
            </div>
          </List.Content>
        </List.Item>
        {(isLoading || this.state.loading) && <DbLoadIndicator />}
      </Fragment>
    );
  }
}

export const DbLoadIndicator = () => {
  return (
    <List.Item style={{ height: '4em' }}>
      <List.Content>
        <Loader style={{ marginLeft: '2em' }} size="small" indeterminate active inline content="Loading" />
      </List.Content>
    </List.Item>
  );
};
