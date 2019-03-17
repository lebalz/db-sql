import * as React from "react";
import { Value } from "slate";
import { Editor } from "slate-react";
import { Provider } from 'mobx-react';
import rootStore from '../stores/root_store';

// Create our initial value...
const initialValue = (Value as any).fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
})
class DbSql extends React.Component {
  // Set the initial value when the app is first constructed.
  state = {
    value: initialValue,
  }

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }) => {
    this.setState({ value })
  }

  render() {
    return (
      <Provider
        rootStore={rootStore}
        sessionStore={rootStore.session}
      >
        <React.Fragment>
          <h1>DB SQL</h1>
          <Editor value={this.state.value} onChange={this.onChange} />
          <p>{(new Date()).toLocaleString('de-CH')}</p>
        </React.Fragment>
      </Provider>
    );
  }
}

export default DbSql
