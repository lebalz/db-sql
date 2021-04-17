import React from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';

interface Props {
  queryIndex: number;
}

export const SkippedResult = ({ queryIndex }: Props) => {
  return (
    <Message positive color="yellow">
      <Message.Header>{`Skipped query ${queryIndex + 1}.`}</Message.Header>
    </Message>
  );
};
