import React from 'react';
import { inject, observer } from 'mobx-react';
import { action, computed } from 'mobx';
import SqlQuery from '../../models/SqlQuery';
import { OwnerType } from '../../api/db_server';
import ClickableIcon from '../../shared/ClickableIcon';
import ViewStateStore from '../../stores/view_state_store';
import fileDownload from 'js-file-download';
import CopyToClipboard from 'react-copy-to-clipboard';
import { CopyState } from '../../models/Result';
import { copyIcon, copyIconColor } from '../../shared/helpers';

interface Props {
  sqlQuery: SqlQuery;
  playTooltip?: string;
  actions?: QueryActions[];
  exclude?: QueryActions[];
  onPlay: () => void;
}

interface InjectedProps extends Props {
  viewStateStore: ViewStateStore;
}

export enum QueryActions {
  Copy = 'copy',
  Download = 'download',
  Star = 'star',
  Play = 'play',
  Share = 'share'
}

@inject('viewStateStore')
@observer
export default class SqlQueryActions extends React.Component<Props> {
  get injected() {
    return this.props as InjectedProps;
  }

  @computed
  get sqlQuery() {
    return this.props.sqlQuery;
  }

  get queryLabels(): QueryActions[] {
    const exclude = this.props.exclude || [];
    if (this.props.actions) {
      return this.props.actions.filter((l) => !exclude.includes(l));
    }
    return Object.values(QueryActions).filter((l) => !exclude.includes(l));
  }

  @action
  onCopy(success: boolean) {
    if (success) {
      this.injected.viewStateStore.setSqlCopyState(this.sqlQuery.id, CopyState.Success);
    } else {
      this.injected.viewStateStore.setSqlCopyState(this.sqlQuery.id, CopyState.Error);
    }
    const { sqlCopyState } = this.injected.viewStateStore;
    setTimeout(() => {
      if (this.injected.viewStateStore.sqlCopyState === sqlCopyState) {
        this.injected.viewStateStore.setSqlCopyState(this.sqlQuery.id, CopyState.Ready);
      }
    }, 1500);
  }

  download = () => {
    fileDownload(
      this.sqlQuery.query,
      `db_sql-${this.sqlQuery.dbName}-${this.sqlQuery.createdAt.getTime()}.sql`,
      'application/sql'
    );
  };

  render() {
    const ownerType = this.sqlQuery.dbServerOwnerType;

    return (
      <div className="query-actions">
        {this.queryLabels.includes(QueryActions.Star) &&
          (ownerType === OwnerType.User || (this.sqlQuery.isOwner && this.sqlQuery.isPrivate)) && (
            <ClickableIcon
              icon={this.sqlQuery.isFavorite ? 'star' : 'star outline'}
              color={this.sqlQuery.isFavorite ? 'yellow' : 'black'}
              onClick={() => this.sqlQuery.toggleIsFavorite()}
            />
          )}
        {this.queryLabels.includes(QueryActions.Play) &&
          (ownerType === OwnerType.User || (this.sqlQuery.isOwner && this.sqlQuery.isPrivate)) && (
            <ClickableIcon
              icon={this.sqlQuery.isValid ? 'play' : 'edit'}
              color={this.sqlQuery.isValid ? 'green' : 'blue'}
              tooltip={this.props.playTooltip}
              onClick={this.props.onPlay}
            />
          )}
        {this.queryLabels.includes(QueryActions.Download) && (
          <ClickableIcon icon="download" color="black" tooltip="Download" onClick={() => this.download()} />
        )}
        {this.queryLabels.includes(QueryActions.Copy) && (
          <CopyToClipboard text={this.sqlQuery.query} onCopy={(_, success) => this.onCopy(success)}>
            <ClickableIcon
              icon={copyIcon(this.injected.viewStateStore.sqlCopyState(this.sqlQuery.id))}
              color={copyIconColor(this.injected.viewStateStore.sqlCopyState(this.sqlQuery.id))}
              tooltip="Copy sql"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </CopyToClipboard>
        )}
        {this.queryLabels.includes(QueryActions.Share) &&
          ownerType === OwnerType.Group &&
          this.sqlQuery.isOwner && (
            <ClickableIcon
              icon={this.sqlQuery.isPrivate ? 'lock' : 'lock open'}
              onClick={() => this.sqlQuery.toggleIsPrivate()}
              tooltip={
                this.sqlQuery.isPrivate ? 'Share this query with your group' : 'Revoke sharing in the group'
              }
              delayed
              tooltipPosition="top right"
            />
          )}
      </div>
    );
  }
}
