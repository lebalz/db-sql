import React from 'react';
import { observer, inject } from 'mobx-react';
import DbConnectionStore from '../../stores/db_connection_store';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/snippets/sql';
import 'ace-builds/src-noconflict/theme-github';
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { computed } from 'mobx';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

interface Completion {
  name: string;
  value: string;
  meta: string;
  score: number;
}

@inject('dbConnectionStore')
@observer
export default class SqlEditor extends React.Component {
  get injected() {
    return this.props as InjectedProps;
  }

  componentDidMount() {
    addCompleter({
      getCompletions: (
        editor: AceEditor,
        session: any,
        caretPosition2d: [number, number],
        prefix: string,
        callback: (error: null | string, res: Completion[]) => void
      ) => {
        callback(null, this.completers);
      }
    });
  }

  @computed
  get completers() {
    const activeDatabase = this.injected.dbConnectionStore?.activeConnection
      ?.activeDatabase;
    if (!activeDatabase) {
      return [];
    }
    const tables = activeDatabase.tables.map((table) => ({
      name: table.name,
      value: table.name,
      meta: 'TABLE',
      score: 1
    }));
    const columns = activeDatabase.tables.reduce((res, table) => {
      const cols = table.columns.map(
        (col) =>
          ({
            name: col.name,
            value: col.name,
            meta: 'COLUMN',
            score: 1
          } as Completion)
      );
      return [...res, ...cols];
    }, [] as Completion[]);
    return [...tables, ...columns];
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { activeConnection } = dbConnectionStore;

    return (
      <AceEditor
        style={{ width: '100%', height: '200px' }}
        mode="sql"
        theme="github"
        onChange={(change) => {
          if (activeConnection?.activeDatabase) {
            activeConnection.activeDatabase.query = change as string;
          }
        }}
        commands={[
          {
            // commands is array of key bindings.
            name: 'Execute Query',
            bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
            exec: () => this.injected.dbConnectionStore.executeQuery()
          }
        ]}
        value={activeConnection?.activeDatabase?.query}
        defaultValue={activeConnection?.activeDatabase?.query}
        name={`db-${activeConnection?.activeDatabase?.name}`}
        editorProps={{ $blockScrolling: true }}
        showPrintMargin={false}
        enableBasicAutocompletion
        enableLiveAutocompletion
      />
    );
  }
}
