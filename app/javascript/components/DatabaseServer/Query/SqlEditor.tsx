import React from 'react';
import { observer } from 'mobx-react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/snippets/sql';
import 'ace-builds/src-noconflict/theme-github';
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { computed } from 'mobx';
import Query from '../../../models/Query';

interface Props {
  query: Query;
  height: number;
}

interface Completion {
  name: string;
  value: string;
  meta: string;
  score: number;
}

@observer
export default class SqlEditor extends React.Component<Props> {
  editorRef = React.createRef<AceEditor>();
  editorId?: string = undefined;
  componentDidMount() {
    const editor = this.editorRef.current?.editor;
    this.editorId = editor?.id;
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

  @computed
  get completers() {
    const { database } = this.props.query;
    const tables = database.tables.map((table) => ({
      name: table.name,
      value: table.name,
      meta: 'TABLE',
      score: 2
    }));
    const columns = database.tables.reduce((res, table) => {
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

  onChange = (value: string, event?: any) => {
    const { query } = this.props;
    const modified = query.derivedExecutionMode !== query.executionMode;

    this.props.query.query = value;

    if (!modified) {
      query.executionMode = query.derivedExecutionMode;
    }
  };

  render() {
    const { query } = this.props;

    return (
      <AceEditor
        style={{ width: '100%', height: `${this.props.height}px` }}
        mode="sql"
        theme="github"
        onChange={this.onChange}
        commands={[
          {
            // commands is array of key bindings.
            name: 'Execute Query',
            bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
            exec: () => query.run()
          }
        ]}
        value={query.query}
        defaultValue={query.query}
        name={query.name}
        ref={this.editorRef}
        editorProps={{ $blockScrolling: true }}
        showPrintMargin={false}
        enableBasicAutocompletion
        enableLiveAutocompletion
      />
    );
  }
}
