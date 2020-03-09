import 'regenerator-runtime/runtime';
import React, { Fragment } from 'react';
import {
  Button,
  Menu,
  Icon,
  Segment,
  Table,
  Message,
  Label,
  Popup,
  Header
} from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { query as fetchQuery } from '../../api/db_connection';
import { QuerySeparationGrammarLexer } from '../../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { RequestState } from '../../stores/session_store';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/snippets/sql';
import 'ace-builds/src-noconflict/theme-github';
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { computed } from 'mobx';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

function identifyCommands(queryText: string) {
  const inputStream = new ANTLRInputStream(queryText);
  console.time('lexing');
  const lexer = new QuerySeparationGrammarLexer(inputStream);
  console.timeLog('lexing');
  const tokenStream = new CommonTokenStream(lexer);
  console.time('parse');
  const parser = new QuerySeparationGrammarParser(tokenStream);
  console.timeLog('parse');
  console.time('queryText');
  const { children } = parser.queriesText();
  console.timeLog('queryText');
  if (!children) {
    return [];
  }

  return children.map(child => child.text).slice(0, -1);
}

interface Completion {
  name: string;
  value: string;
  meta: string;
  score: number;
}

@inject('dbConnectionStore')
@observer
export default class Database extends React.Component {
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
    const tables = activeDatabase.tables.map(table => ({
      name: table.name,
      value: table.name,
      meta: 'TABLE',
      score: 1
    }));
    const columns = activeDatabase.tables.reduce((res, table) => {
      const cols = table.columns.map(
        col =>
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
    const {
      loadedConnections,
      activeConnection,
      queryState
    } = dbConnectionStore;
    const loadedDbs = activeConnection
      ? activeConnection.databases.filter(db => db.isLoaded)
      : [];
    return (
      <Fragment>
        <Menu stackable secondary compact size="mini" color="teal">
          {loadedConnections.map((conn, i) => {
            return (
              <Menu.Item
                key={i}
                onClick={() => (dbConnectionStore.activeConnection = conn)}
                active={activeConnection === conn}
              >
                <Icon name="plug" />
                {conn.name}
                {activeConnection === conn && (
                  <Button
                    icon="close"
                    onClick={() => conn.close()}
                    floated="right"
                    style={{
                      padding: '2px',
                      marginLeft: '4px',
                      marginRight: '-4px'
                    }}
                  />
                )}
              </Menu.Item>
            );
          })}
        </Menu>
        <Segment>
          <Menu attached="top" tabular size="mini">
            {loadedDbs.map((db, i) => {
              return (
                <Menu.Item
                  name={db.name}
                  active={
                    !!activeConnection && activeConnection.activeDatabase === db
                  }
                  key={`db-${i}`}
                  onClick={() => {
                    if (activeConnection) {
                      activeConnection.activeDatabase = db;
                    }
                  }}
                />
              );
            })}
          </Menu>
          <Segment attached="bottom">
            <AceEditor
              style={{ width: '100%', height: '200px' }}
              mode="sql"
              theme="github"
              onChange={(change) => {
                if (activeConnection?.activeDatabase) {
                  activeConnection.activeDatabase.query = change as string;
                }
              }}
              value={activeConnection?.activeDatabase?.query}
              defaultValue={activeConnection?.activeDatabase?.query}
              name={`db-${activeConnection?.activeDatabase?.name}`}
              editorProps={{ $blockScrolling: true }}
              showPrintMargin={false}
              enableBasicAutocompletion
              enableLiveAutocompletion
            />
            <Button
              positive
              disabled={queryState === RequestState.Waiting}
              loading={queryState === RequestState.Waiting}
              onClick={() => {
                if (!activeConnection || !activeConnection.activeDatabase) {
                  return;
                }
                this.injected.dbConnectionStore.queryState =
                  RequestState.Waiting;
                const conn = activeConnection.activeDatabase;
                const rawInput = conn.query;
                const t0 = Date.now();
                const queries = identifyCommands(rawInput);
                console.log('Time to parse: ', (Date.now() - t0) / 1000.0);
                fetchQuery(activeConnection.id, conn.name, queries)
                  .then(({ data }) => {
                    console.log('Got result: ', (Date.now() - t0) / 1000.0);
                    conn.results = data;
                    console.log(data);
                    this.injected.dbConnectionStore.queryState =
                      RequestState.Success;
                  })
                  .catch(e => {
                    this.injected.dbConnectionStore.queryState =
                      RequestState.Error;
                  });
              }}
            >
              Query
            </Button>
            {activeConnection &&
              activeConnection.activeDatabase &&
              activeConnection.activeDatabase.results && (
                <Fragment>
                  <Header as="h5" attached="top">
                    Result
                    <Popup
                      content={`${_.sumBy(
                        activeConnection.activeDatabase.results,
                        'time'
                      )}s`}
                      trigger={
                        <Label color="blue">
                          {_.sumBy(
                            activeConnection.activeDatabase.results,
                            'time'
                          ).toFixed(2)}
                          s
                        </Label>
                      }
                    />
                    {activeConnection.activeDatabase.results.filter(
                      r => !!r.error
                    ).length > 0 ? (
                      <Popup
                        content={`Errors: ${
                          activeConnection.activeDatabase.results.filter(
                            r => !!r.error
                          ).length
                        }`}
                        trigger={
                          <Label color="orange">
                            {`${activeConnection.activeDatabase.results.length -
                              activeConnection.activeDatabase.results.filter(
                                r => !!r.error
                              ).length}/${
                              activeConnection.activeDatabase.results.length
                            } successful`}
                          </Label>
                        }
                      />
                    ) : (
                      <Popup
                        content={'Executed all queries successfully'}
                        trigger={
                          <Label color="green">
                            {`Queries: ${activeConnection.activeDatabase.results.length}`}
                          </Label>
                        }
                      />
                    )}
                  </Header>
                  <Segment attached>
                    {activeConnection.activeDatabase.results.map(
                      (result, idx) => {
                        const TimeLabel = (
                          <Popup
                            content={`${
                              result.result ? `${result.result.length} in ` : ''
                            }${result.time}s`}
                            trigger={
                              <Label
                                color="blue"
                                floating
                                style={{ left: 'unset', right: '-1em' }}
                              >
                                {result.result
                                  ? `${result.result.length} in `
                                  : ''}
                                {result.time.toFixed(2)}s
                              </Label>
                            }
                          />
                        );
                        if (result.error) {
                          return (
                            <Message negative>
                              {TimeLabel}
                              <Message.Header>{`Error in the ${idx +
                                1}. query`}</Message.Header>
                              <p>{result.error}</p>
                            </Message>
                          );
                        }
                        if (result.result!.length === 0) {
                          return (
                            <Message positive>
                              {TimeLabel}
                              <Message.Header>{`Successful ${idx +
                                1}. query`}</Message.Header>
                            </Message>
                          );
                        }
                        return (
                          <div
                            key={`result-${idx}`}
                            style={{ position: 'relative' }}
                          >
                            {TimeLabel}
                            <Table celled>
                              <Table.Header>
                                <Table.Row>
                                  {Object.keys(result.result![0] || []).map(
                                    (val, i) => {
                                      return (
                                        <Table.HeaderCell key={i}>
                                          {val}
                                        </Table.HeaderCell>
                                      );
                                    }
                                  )}
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {result.result!.map((val, i) => {
                                  return (
                                    <Table.Row key={i}>
                                      {Object.values(val).map((ds, j) => {
                                        return (
                                          <Table.Cell key={j}>{ds}</Table.Cell>
                                        );
                                      })}
                                    </Table.Row>
                                  );
                                })}
                              </Table.Body>
                            </Table>
                          </div>
                        );
                      }
                    )}
                  </Segment>
                </Fragment>
              )}
          </Segment>
        </Segment>
      </Fragment>
    );
  }
}
