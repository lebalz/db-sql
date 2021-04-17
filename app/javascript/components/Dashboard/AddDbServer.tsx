import React from 'react';
import { observer, inject } from 'mobx-react';
import DbServerStore from '../../stores/db_server_store';
import { TempDbServer, TempDbServerRole } from '../../models/TempDbServer';
import { RouterStore } from 'mobx-react-router';
import SchemaQueryStore from '../../stores/schema_query_store';
import { OwnerType } from '../../api/db_server';
import { DEFAULT_DB_SERVER } from '../../models/DbServer';
import AddEntityButton from '../../shared/AddEntityButton';

interface Props {
  ownerType: OwnerType;
  ownerId: string;
}

interface InjectedProps extends Props {
  dbServerStore: DbServerStore;
  routerStore: RouterStore;
  schemaQueryStore: SchemaQueryStore;
}

@inject('dbServerStore', 'routerStore', 'schemaQueryStore')
@observer
export default class AddDbServer extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }
  render() {
    return (
      <AddEntityButton
        onClick={() => {
          const temp = new TempDbServer(
            { ...DEFAULT_DB_SERVER, owner_type: this.props.ownerType, owner_id: this.props.ownerId },
            this.injected.dbServerStore,
            this.injected.schemaQueryStore,
            TempDbServerRole.Create,
            this.injected.dbServerStore.cancelToken
          );
          this.injected.dbServerStore.setTempDbServer(temp);
        }}
        title="Add new db server"
      />
    );
  }
}
