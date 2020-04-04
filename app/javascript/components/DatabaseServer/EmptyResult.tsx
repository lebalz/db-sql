import React from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';

interface Props {
  queryIndex: number;
}

export const EmptyResult = ({ queryIndex }: Props) => {
  return (
    <Message positive>
      <Message.Header>{`Successfully executed query ${queryIndex + 1}.`}</Message.Header>
    </Message>
  );
};
