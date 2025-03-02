import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunk to fetch receivers
const fetchReceivers = createAsyncThunk(
  'receiver/fetchReceivers',
  async (_, { rejectWithValue }) => {
    try {
      const receiversJSON = await AsyncStorage.getItem('savedReceivers');
      return receiversJSON ? JSON.parse(receiversJSON) : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to save receivers to AsyncStorage
const saveReceiversToStorage = async (receivers) => {
  try {
    await AsyncStorage.setItem('savedReceivers', JSON.stringify(receivers));
    console.log("Saved receivers to AsyncStorage:", receivers);
  } catch (error) {
    console.error("Error saving receivers to AsyncStorage:", error);
  }
};

const initialState = {
  receivers: [],
  loading: false,
  error: null,
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
      state.receivers.push({ ...action.payload });
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceivers.fulfilled, (state, action) => {
        state.receivers = action.payload;
        state.loading = false;
      })
      .addCase(fetchReceivers.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

// Thunk to add a receiver with AsyncStorage
const addReceiverAsync = (receiver) => async (dispatch, getState) => {
  dispatch(addReceiver(receiver));
  const { receiver: receiverState } = getState();
  await saveReceiversToStorage(receiverState.receivers);
};

// Thunk to update a receiver with AsyncStorage
const updateReceiverAsync = (receiver) => async (dispatch, getState) => {
  dispatch(updateReceiver(receiver));
  const { receiver: receiverState } = getState();
  await saveReceiversToStorage(receiverState.receivers);
};

// Thunk to remove a receiver with AsyncStorage
const removeReceiverAsync = (receiverId) => async (dispatch, getState) => {
  dispatch(removeReceiver(receiverId));
  const { receiver: receiverState } = getState();
  await saveReceiversToStorage(receiverState.receivers);
};

const { addReceiver, updateReceiver, removeReceiver, setCurrentReceiver, clearCurrentReceiver } = receiverSlice.actions;

module.exports = receiverSlice.reducer;
module.exports.fetchReceivers = fetchReceivers;
module.exports.addReceiverAsync = addReceiverAsync;
module.exports.updateReceiverAsync = updateReceiverAsync;
module.exports.removeReceiverAsync = removeReceiverAsync;
module.exports.addReceiver = addReceiver;
module.exports.updateReceiver = updateReceiver;
module.exports.removeReceiver = removeReceiver;
module.exports.setCurrentReceiver = setCurrentReceiver;
module.exports.clearCurrentReceiver = clearCurrentReceiver;