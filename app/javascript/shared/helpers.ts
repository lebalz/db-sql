import { SemanticCOLORS, SemanticICONS } from 'semantic-ui-react';
import { ResultState } from '../api/db_server';
import { CopyState, TableData } from '../models/Result';

export const copyIconColor = (state: CopyState): SemanticCOLORS | undefined => {
  switch (state) {
    case CopyState.Error:
      return 'red';
    case CopyState.Success:
      return 'green';
    case CopyState.Ready:
      return;
    case CopyState.Copying:
      return 'blue';
  }
};

export const copyIcon = (state: CopyState): SemanticICONS => {
  switch (state) {
    case CopyState.Error:
      return 'close';
    case CopyState.Success:
      return 'check';
    case CopyState.Ready:
      return 'copy';
    case CopyState.Copying:
      return 'copy';
  }
};
