import React, { Fragment } from 'react';
import { Header } from 'semantic-ui-react';
import Footer from './Navigation/Footer';
import NavBar from './Navigation/NavBar';

export default class Dashboard extends React.Component {
  render() {
    return (
      <Fragment>
        <header>
          <NavBar />
        </header>
        <main className="no-sidebar">
          <Header as="h1" content="Welcome to DB SQL" />
        </main>
        <Footer />
      </Fragment>
    );
  }

}