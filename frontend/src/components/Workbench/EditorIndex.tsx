import React from 'react';
import { Button, Menu, Icon } from 'semantic-ui-react';
import { inject, observer } from 'mobx-react';
import _ from 'lodash';
import QueryEditor from '../../models/QueryEditor';
import { RouterStore } from 'mobx-react-router';
import { REST } from '../../declarations/REST';
import { action, computed } from 'mobx';

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
    } else if (numQueries === 1) {
      query.database.dbServer.close();
    }
  }

  @computed
  get activeEditor(): QueryEditor | undefined {
    return this.props.editors.find((e) => e.isActive);
  }

  @action
  newTab(editor?: QueryEditor) {
    const query = editor?.database.addQuery();
    query?.setActive();
  }

  render() {
    return (
      <Menu attached="top" tabular size="mini" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        {this.props.editors.map((editor) => {
          return (
            <Menu.Item
              active={editor.isActive}
              key={`db-${editor.name}`}
              onClick={() => {
                this.injected.routerStore.push(editor.link);
                editor.setActive();
              }}
            >
              {editor.requestState === REST.Requested && (
                <Icon name="circle notch" loading color="grey" style={{ height: '1.02em' }} />
              )}
              {editor.name}
              {editor.isActive && (
                <Button
                  icon="close"
                  onClick={(e) => this.close(e, editor)}
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
        {this.activeEditor && (
          <Menu.Item>
            <Button
              icon="add"
              floated="left"
              size="mini"
              onClick={() => this.newTab(this.activeEditor)}
              style={{
                padding: '4px',
                marginLeft: '-12px'
              }}
            />
          </Menu.Item>
        )}
      </Menu>
    );
  }
}
