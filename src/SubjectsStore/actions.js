import timeRequest from "../TimeRequest.js";

const LocalStorage = window.localStorage;

export default {
  addItem(context, payload) {
    context.commit('addItem', payload);

    LocalStorage.setItem('subjects', JSON.stringify(context.state));
  },

  clearItem(context, payload) {
    context.commit('clearItem', payload);

    LocalStorage.setItem('subjects', JSON.stringify(context.state));
  },

  setState(context, payload) {
    const state = JSON.parse((LocalStorage.getItem('subjects') || {
      description: 'Список предметов',
      time: '',
      items: [
      ],
    }));
    context.commit('setState', state);
  },

  setTime(context, payload) {
    timeRequest.getTime('api/timezone/Europe/Moscow')
      .then((result) => {
        context.commit('setTime', new Date(result.datetime));

        LocalStorage.setItem('subjects', JSON.stringify(context.state));
      });
  }
};
