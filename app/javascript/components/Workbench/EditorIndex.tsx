import React from 'react';
import { Button, Menu, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import QueryEditor from '../../models/QueryEditor';
import { RouterStore } from 'mobx-react-router';
import { REST } from '../../declarations/REST';

interface Props {
  editors: QueryEditor[];
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
}

@inject('routerStore')
@observer
export default class EditorIndex extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  close(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, query: QueryEditor) {
    e.stopPropagation();

    const idx = this.props.editors.indexOf(query);
    query.close();

    const numQueries = this.props.editors.length;
    if (numQueries > 1) {
      const nextQuery = this.props.editors[idx > 0 ? idx - 1 : 1];
      this.injected.routerStore.push(nextQuery.link);
      nextQuery.setActive();
    }
  }

  render() {
    return (
      <Menu attached="top" tabular size="mini">
        {this.props.editors.map((query) => {
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
                    marginRight: '-4px'
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
