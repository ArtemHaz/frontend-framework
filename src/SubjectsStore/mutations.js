export default {
  addItem(state, payload) {
    state.items.push({name: payload.name, id: payload.id});

    return state;
  },

  clearItem(state, payload) {
    state.items.splice(payload, 1);

    return state;
  },

  setState(state, payload) {
    state = payload;

    return state;
  },

  setTime(state, payload) {
    state.time = payload;

    return state;
  },
};
