import React from 'react';
import { observer } from 'mobx-react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-mysql';
import 'ace-builds/src-noconflict/mode-pgsql';

import 'ace-builds/src-noconflict/theme-github';

import 'ace-builds/src-noconflict/snippets/sql';
import 'ace-builds/src-noconflict/snippets/mysql';
import 'ace-builds/src-noconflict/snippets/pgsql';

import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { computed } from 'mobx';
import Query from '../../../models/Query';
import Sql from '../../../models/Sql';

interface Props {
  sql: Sql;
  height?: number;
  readOnly?: boolean;
}

interface Completion {
  name: string;
  value: string;
  meta: string;
  score: number;
}

const EXECUTE_QUERY_COMMAND = 'executeQuery';

@observer
export default class SqlEditor extends React.Component<Props> {
  editorRef = React.createRef<AceEditor>();
  editorId?: string = undefined;

  componentDidMount() {
    const editor = this.editorRef.current?.editor;
    this.editorId = editor?.id;
    if (editor) {
      editor.commands.addCommand({
        // commands is array of key bindings.
        name: EXECUTE_QUERY_COMMAND,
        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec: () => this.props.sql.run()
      });
    }
    addCompleter({
      getCompletions: (
        editor: AceEditor,
        session: any,
        caretPosition2d: [number, number],
        prefix: string,
        callback: (error: null | string, res: Completion[]) => void
      ) => {
        callback(null, (editor as any).id === this.editorId ? this.completers : []);
      }
    });
  }

  // ensure ace is resized when it's height changes
  componentDidUpdate(prevProps: Props) {
    if (prevProps.height !== this.props.height && this.editorRef.current) {
      this.editorRef.current.editor.resize();
    }
  }

  componentWillUnmount() {
    const editor = this.editorRef.current?.editor;
    this.editorId = editor?.id;
    if (editor) {
      const cmd = editor.commands.commands[EXECUTE_QUERY_COMMAND];
      if (cmd) {
        editor.commands.removeCommand(cmd, true);
      }
    }
  }

  @computed
  get completers() {
    const completions: Completion[] = [];
    const { database } = this.props.sql;

    database?.schemas?.forEach((schema) => {
      completions.push({
        name: schema.name,
        value: schema.name,
        meta: 'SCHEMA',
        score: 3
      });
      schema.tables.forEach((table) => {
        completions.push({
          name: table.name,
          value: table.name,
          meta: 'TABLE',
          score: 2
        });
        table.columns.forEach((col) => {
          completions.push({
            name: col.name,
            value: col.name,
            meta: 'COLUMN',
            score: 1
          });
        });
      });
    });
    return completions;
  }

  onChange = (value: string, event?: any) => {
    const { sql } = this.props;
    sql.onSqlChange(value);
  };


  render() {
    const { sql } = this.props;

    return (
      <AceEditor
        readOnly={this.props.readOnly}
        style={{ width: '100%', height: this.props.height ? `${this.props.height}px` : '100%' }}
        mode={sql.databaseType}
        theme="github"
        onChange={this.onChange}
        value={sql.query}
        defaultValue={sql.query}
        name={sql.name}
        ref={this.editorRef}
        editorProps={{ $blockScrolling: true }}
        showPrintMargin={false}
        enableBasicAutocompletion
        enableLiveAutocompletion
      />
    );
  }
}
