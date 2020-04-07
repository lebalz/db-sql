import React from 'react';
import { Button, Menu, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import Query from '../../models/Query';
import { RouterStore } from 'mobx-react-router';
import { action } from 'mobx';
import { REST } from '../../declarations/REST';

interface Props {
  queries: Query[];
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
}

@inject('routerStore')
@observer
export default class QueryIndex extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  close(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, query: Query) {
    e.stopPropagation();

    const idx = this.props.queries.indexOf(query);
    query.close();

    const numQueries = this.props.queries.length;
    if (numQueries > 1) {
      const nextQuery = this.props.queries[idx > 0 ? idx - 1 : 1];
      this.injected.routerStore.push(nextQuery.link);
      nextQuery.setActive();
    }
  }

  render() {
    return (
      <Menu attached="top" tabular size="mini">
        {this.props.queries.map((query) => {
          return (
            <Menu.Item
              active={query.isActive}
              key={`db-${query.name}`}
              onClick={() => {
                this.injected.routerStore.push(query.link);
                query.setActive();
              }}
            >
              {query.requestState === REST.Requested && (
                <Icon name="circle notch" loading color="grey" style={{ height: '1.02em' }} />
              )}
              {query.name}
              {query.isActive && (
                <Button
                  icon="close"
                  onClick={(e) => this.close(e, query)}
                  floated="right"
                  style={{
                    padding: '2px',
                    marginLeft: '4px',
                    marginRight: '-4px',
                  }}
                />
              )}
            </Menu.Item>
          );
        })}
      </Menu>
    );
  }
}
