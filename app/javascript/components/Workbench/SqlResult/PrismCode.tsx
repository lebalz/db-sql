import React from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-markdown.min.js';

import 'prismjs/plugins/line-numbers/prism-line-numbers.min.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

interface Props {
  code: string;
  plugins?: string[];
  language: 'sql' | 'json' | 'markdown' | 'any';
  style?: React.CSSProperties;
  trim?: boolean;
}

export class PrismCode extends React.Component<Props> {
  ref = React.createRef<HTMLElement>();

  componentDidMount() {
    this.highlight();
  }
  componentDidUpdate() {
    this.highlight();
  }

  highlight = () => {
    if (this.ref && this.ref.current) {
      Prism.highlightElement(this.ref.current);
    }
  };
  render() {
    const { code, plugins, language } = this.props;
    return (
      <pre className={!plugins ? '' : plugins.join(' ')} style={this.props.style}>
        <code ref={this.ref} className={`language-${language}`}>
          {this.props.trim ? code.trim() : code}
        </code>
      </pre>
    );
  }
}
