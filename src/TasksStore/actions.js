const LocalStorage = window.localStorage;

export default {
  addItem(context, payload) {
    context.commit('addItem', payload);

    LocalStorage.setItem('tasks', JSON.stringify(context.state));
  },

  addSubject(context, payload) {
    context.commit('addSubject', payload);

    LocalStorage.setItem('tasks', JSON.stringify(context.state));
  },

  changeTaskStatus(context, payload) {
    context.commit('changeTaskStatus', payload);

    LocalStorage.setItem('tasks', JSON.stringify(context.state));
  },

  clearItem(context, payload) {
    context.commit('clearItem', payload);

    LocalStorage.setItem('tasks', JSON.stringify(context.state));
  },

  clearSubject(context, payload) {
    context.commit('clearSubject', payload);

    LocalStorage.setItem('tasks', JSON.stringify(context.state));
  },

  setState(context, payload) {
    const state = JSON.parse((LocalStorage.getItem('tasks') || {subjects: {}}))
    context.commit('setState', state);
  }
};
