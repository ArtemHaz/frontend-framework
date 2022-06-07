export default {
  addItem(state, payload) {
    state.subjects[payload.subjectId].items.push({name: payload.name, isDone: false, date: payload.date});

    return state;
  },

  addSubject(state, payload) {
    state.subjects[payload.id] = {
      subjectId: payload.id,
      subjectName: payload.name,
      items: [],
    };

    return state;
  },

  changeTaskStatus(state, payload) {
    const prevStatus = state.subjects[payload.subjectId].items[payload.taskId].isDone;
    state.subjects[payload.subjectId].items[payload.taskId].isDone = !prevStatus;

    return state;
  },

  clearItem(state, payload) {
    state.subjects[payload.subjectId].items.splice(payload.index, 1);

    return state;
  },

  clearSubject(state, payload) {
    state.subjects[payload + 1] = {};

    return state;
  },

  setState(state, payload) {
    state = payload;

    return state;
  }
};
