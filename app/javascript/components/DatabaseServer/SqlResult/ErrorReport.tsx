import React from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';

interface Props {
  queryIndex: number;
  error: string;
}

export const ErrorReport = ({ error, queryIndex }: Props) => {
  return (
    <Message error>
      <Message.Header>{`Error in the ${queryIndex + 1}. query`}</Message.Header>
      <p>{error}</p>
    </Message>
  );
};
