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

// Async thunk to add a receiver
const addReceiverAsync = createAsyncThunk(
  'receiver/addReceiverAsync',
  async (receiver, { getState, rejectWithValue }) => {
    try {
      const { receiver: receiverState } = getState();
      const updatedReceivers = [...receiverState.receivers, receiver];
      await AsyncStorage.setItem('savedReceivers', JSON.stringify(updatedReceivers));
      console.log("Saved receivers to AsyncStorage:", updatedReceivers);
      return receiver;
    } catch (error) {
      console.error("Error saving receiver to AsyncStorage:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update a receiver
const updateReceiverAsync = createAsyncThunk(
  'receiver/updateReceiverAsync',
  async (receiver, { getState, rejectWithValue }) => {
    try {
      const { receiver: receiverState } = getState();
      const updatedReceivers = receiverState.receivers.map(rec => 
        rec.id === receiver.id ? receiver : rec
      );
      await AsyncStorage.setItem('savedReceivers', JSON.stringify(updatedReceivers));
      console.log("Updated receivers in AsyncStorage:", updatedReceivers);
      return receiver;
    } catch (error) {
      console.error("Error updating receiver in AsyncStorage:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to remove a receiver
const removeReceiverAsync = createAsyncThunk(
  'receiver/removeReceiverAsync',
  async (receiverId, { getState, rejectWithValue }) => {
    try {
      const { receiver: receiverState } = getState();
      const updatedReceivers = receiverState.receivers.filter(rec => rec.id !== receiverId);
      await AsyncStorage.setItem('savedReceivers', JSON.stringify(updatedReceivers));
      console.log("Removed receiver from AsyncStorage, updated list:", updatedReceivers);
      return receiverId;
    } catch (error) {
      console.error("Error removing receiver from AsyncStorage:", error);
      return rejectWithValue(error.message);
    }
  }
);

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
    setCurrentReceiver: (state, action) => {
      state.currentReceiver = { ...state.currentReceiver, ...action.payload };
    },
    clearCurrentReceiver: (state) => {
      state.currentReceiver = initialState.currentReceiver;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch receivers cases
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
      })
      
      // Add receiver cases
      .addCase(addReceiverAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReceiverAsync.fulfilled, (state, action) => {
        state.receivers.push(action.payload);
        state.loading = false;
      })
      .addCase(addReceiverAsync.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Update receiver cases
      .addCase(updateReceiverAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReceiverAsync.fulfilled, (state, action) => {
        const index = state.receivers.findIndex((rec) => rec.id === action.payload.id);
        if (index !== -1) state.receivers[index] = action.payload;
        state.loading = false;
      })
      .addCase(updateReceiverAsync.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Remove receiver cases
      .addCase(removeReceiverAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeReceiverAsync.fulfilled, (state, action) => {
        state.receivers = state.receivers.filter((rec) => rec.id !== action.payload);
        state.loading = false;
      })
      .addCase(removeReceiverAsync.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

const { setCurrentReceiver, clearCurrentReceiver } = receiverSlice.actions;

export default receiverSlice.reducer;
export {
  fetchReceivers,
  addReceiverAsync,
  updateReceiverAsync,
  removeReceiverAsync,
  setCurrentReceiver,
  clearCurrentReceiver
};