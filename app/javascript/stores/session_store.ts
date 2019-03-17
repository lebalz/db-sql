import { observable, reaction } from "mobx";
import { RootStore } from "./root_store";


class SessionStore {
  @observable currentUser: any = null;
  private readonly root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    reaction(
      () => this.root.initialized,
      (initialized) => console.log('Initialized: ', initialized)
    );
  }

}

export default SessionStore;