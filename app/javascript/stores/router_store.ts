
import { RouterStore as ReactRouterStore } from 'mobx-react-router';
import { Store } from './root_store';

class RouterStore extends ReactRouterStore implements Store {
  cleanup() {}
}

export default RouterStore;