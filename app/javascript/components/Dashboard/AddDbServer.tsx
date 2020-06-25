import React from 'react';
import { observer, inject } from 'mobx-react';
import { Card, Label, Button } from 'semantic-ui-react';
import DbServerStore from '../../stores/db_server_store';
import { TempDbServer, TempDbServerRole } from '../../models/TempDbServer';
import { action, computed } from 'mobx';
import { RouterStore } from 'mobx-react-router';
import Tooltip from '../../shared/Tooltip';
import SchemaQueryStore from '../../stores/schema_query_store';
import { OwnerType, DbServer } from '../../api/db_server';
import { DbType } from '../../models/DbServer';
import AddEntityButton from '../../shared/AddEntityButton';

const DEFAULT_DB_SERVER: DbServer = {
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner_type: OwnerType.User,
  owner_id: '',
  db_type: DbType.Psql,
  host: '',
  id: '',
  name: '',
  port: 5432,
  username: '',
  query_count: 0,
  database_schema_query_id: '',
  error_query_count: 0
};

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
