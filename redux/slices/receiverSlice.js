const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  receivers: [],
  currentReceiver: {
    name: '',
    phoneNumber: '',
  },
};

const receiverSlice = createSlice({
  name: 'receiver',
  initialState,
  reducers: {
    addReceiver: (state, action) => {
      state.receivers.push({ ...action.payload, id: Date.now().toString() });
    },
    updateReceiver: (state, action) => {
      const index = state.receivers.findIndex((rec) => rec.id === action.payload.id);
      if (index !== -1) state.receivers[index] = action.payload;
    },
    removeReceiver: (state, action) => {
      state.receivers = state.receivers.filter((rec) => rec.id !== action.payload);
    },
    setCurrentReceiver: (state, action) => {
      state.currentReceiver = { ...state.currentReceiver, ...action.payload };
    },
    clearCurrentReceiver: (state) => {
      state.currentReceiver = initialState.currentReceiver;
    },
  },
});

const {
  addReceiver,
  updateReceiver,
  removeReceiver,
  setCurrentReceiver,
  clearCurrentReceiver,
} = receiverSlice.actions;

module.exports = receiverSlice.reducer;
module.exports.addReceiver = addReceiver;
module.exports.updateReceiver = updateReceiver;
module.exports.removeReceiver = removeReceiver;
module.exports.setCurrentReceiver = setCurrentReceiver;
module.exports.clearCurrentReceiver = clearCurrentReceiver;