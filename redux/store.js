import { configureStore } from '@reduxjs/toolkit';
import addressReducer from './slices/addressSlice';
import receiverReducer from './slices/receiverSlice';
import petReducer from './slices/petSlice';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    address: addressReducer,
    receiver: receiverReducer,
    pet: petReducer,
    location: locationReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});