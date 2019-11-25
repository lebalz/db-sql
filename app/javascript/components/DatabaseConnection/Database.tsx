import 'regenerator-runtime/runtime';
import React, { Fragment } from 'react';
import { Button, Menu, Icon, Segment, Table, Message, Label, Popup } from 'semantic-ui-react';
import DbConnectionStore from '../../stores/db_connection_store';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import { query as fetchQuery } from '../../api/db_connection';
import { QuerySeparationGrammarLexer } from '../../antlr/QuerySeparationGrammarLexer';
import { QuerySeparationGrammarParser } from '../../antlr/QuerySeparationGrammarParser';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { RequestState } from '../../stores/session_store';

interface InjectedProps {
  dbConnectionStore: DbConnectionStore;
}

function identifyCommands(queryText: string) {
  const inputStream = new ANTLRInputStream(queryText);
  const lexer = new QuerySeparationGrammarLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new QuerySeparationGrammarParser(tokenStream);
  const { children } = parser.queriesText();
  if (!children) {
    return [];
  }

  return children.map(child => child.text).slice(0, -1);
}

@inject('dbConnectionStore')
@observer
export default class Database extends React.Component {

  get injected() {
    return this.props as InjectedProps;
  }

  render() {
    const { dbConnectionStore } = this.injected;
    const { loadedConnections, activeConnection } = dbConnectionStore;
    const loadedDbs = activeConnection ? activeConnection.databases.filter(db => db.isLoaded) : [];
    return (
      <Fragment>
        <Menu
          stackable
          secondary
          compact
          size="mini"
          color="teal"
        >
          {
            loadedConnections.map((conn, i) => {
              return (
                <Menu.Item
                  key={i}
                  onClick={() => dbConnectionStore.activeConnection = conn}
                  active={activeConnection === conn}
                >
                  <Icon name="plug" />
                  {conn.name}
                  {
                    activeConnection === conn &&
                    (
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
                    )
                  }
                </Menu.Item>
              );
            })
          }
        </Menu>
        <Segment>
          <Menu attached="top" tabular size="mini">
            {loadedDbs.map((db, i) => {
              return (
                <Menu.Item
                  name={db.name}
                  active={
                    !!activeConnection &&
                    activeConnection.activeDatabase === db
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
            <textarea
              id="query"
              style={{ width: '100%', height: '200px' }}
            />
            <Button
              onClick={
                () => {
                  if (!activeConnection || !activeConnection.activeDatabase) {
                    return;
                  }
                  const conn = activeConnection.activeDatabase;
                  const rawInput = (document.getElementById('query') as any).value;
                  const queries = identifyCommands(rawInput);
                  fetchQuery(
                    activeConnection.id,
                    conn.name,
                    queries
                  ).then(({ data }) => {
                    conn.results = data;
                    console.log(data);
                  });
                }
              }
            >
              Query
            </Button>
            {
              activeConnection && activeConnection.activeDatabase &&
              activeConnection.activeDatabase.results &&
              activeConnection.activeDatabase.results.map((result, idx) => {
                if (result.error) {
                  return (
                    <Message negative>
                      <Message.Header>{`Error in the ${idx + 1}. query`}</Message.Header>
                      <p>{result.error}</p>
                    </Message>
                  );
                }
                if (result.result!.length === 0) {
                  return (
                    <Message positive>
                      <Message.Header>{`Successful ${idx + 1}. query`}</Message.Header>
                    </Message>
                  );
                }
                return (
                  <Table celled key={`result-${idx}`}>
                    <Table.Header>
                      <Table.Row>
                          {Object.keys(result.result![0] || []).map((val, i) => {
                          return (
                            <Table.HeaderCell key={i}>
                              {val}
                            </Table.HeaderCell>
                          );
                        })}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {
                          result.result!.map((val, i) => {
                          return (
                            <Table.Row key={i}>
                              {
                                Object.values(val).map((ds, j) => {
                                  return (
                                    <Table.Cell key={j}>
                                      {ds}
                                    </Table.Cell>
                                  );
                                })
                              }
                            </Table.Row>
                          );
                        })
                      }
                    </Table.Body>
                  </Table>
                );
              })
            }
          </Segment>
        </Segment>
      </Fragment>
    );
  }

}