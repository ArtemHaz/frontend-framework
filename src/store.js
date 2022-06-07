import PubSub from './pubsub.js';

export default class Store {
  constructor(params) {
    this.actions = {};
    this.mutations = {};
    this.state = {};

    this.status = 'resting';

    this.events = new PubSub();

    const self = this;

    if(params.hasOwnProperty('actions')) {
      this.actions = params.actions;
    }

    if(params.hasOwnProperty('mutations')) {
      this.mutations = params.mutations;
    }

    this.state = new Proxy((params.state || {}), {
      set: function(state, key, value) {
        state[key] = value;
        self.events.publish('stateChange', self.state);

        if(self.status !== 'mutation') {
          console.warn(`You should use a dispatch() method to set new state with key: ${key}`);
        }

        return true;
      }
    });
  }

  dispatch(actionKey, payload = {}) {
    if(typeof this.actions[actionKey] !== 'function') {
      console.error(`Action "${actionKey} doesn't exist.`);
      return false;
    }

    this.status = 'action';
    this.actions[actionKey](this, payload);

    return true;
  }

  commit(mutationKey, payload) {
    if(typeof this.mutations[mutationKey] !== 'function') {
      console.log(`Mutation "${mutationKey}" doesn't exist`);
      return false;
    }

    this.status = 'mutation';
    let newState = this.mutations[mutationKey](this.state, payload);
    this.state = Object.assign(this.state, newState);
    this.status = 'resting';

    return true;
  }

  subscribe(callback) {
    this.events.subscribeOne('stateChange', callback);
  }
}
