import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

// Async thunks
const fetchSavedAddresses = createAsyncThunk(
  'address/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const addresses = await AsyncStorage.getItem('savedAddresses');
      return addresses ? JSON.parse(addresses) : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const addAddress = createAsyncThunk(
  'address/addSavedAddress',
  async (address, { getState, rejectWithValue }) => {
    try {
      const newAddress = { ...address, id: Date.now().toString() };
      const { address: addressState } = getState();
      const updatedAddresses = [...addressState.savedAddresses, newAddress];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      
      return newAddress;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  savedAddresses: [],  // Initialize as empty array, not with AsyncStorage.getItem()
  loading: false,
  error: null,
  defaultId: null,
  searchQuery: '',
  searchResults: [],
  selectedAddress: null,
  currentAddress: {
    pinCode: '',
    city: '',
    state: '',
    houseFlatNo: '',
    buildingNo: '',
    roadName: '',
    area: '',
    isDefault: false,
    landmark: '',
    addressType: 'Home',
    colony: '',
    latitude: null,
    longitude: null,
    receiverId: null,
    petId: null,
    formattedAddress: "",
    fullAddress: "",
    placeName: "",
    placeId: ""
  },
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addSavedAddress: (state, action) => {
      const newAddress = { ...action.payload, id: Date.now().toString() };
      state.savedAddresses.push(newAddress);
      // Don't do AsyncStorage operations in reducers
      // Move this to an async thunk or middleware
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
      // Move AsyncStorage operations to thunks
    },
    setDefaultAddress: (state, action) => {
      state.defaultId = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = { ...state.currentAddress, ...action.payload };
    },
    clearCurrentAddress: (state) => {
      state.currentAddress = initialState.currentAddress;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSavedAddresses
      .addCase(fetchSavedAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedAddresses.fulfilled, (state, action) => {
        state.savedAddresses = action.payload;
        state.loading = false;
      })
      .addCase(fetchSavedAddresses.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Handle addAddress
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.savedAddresses.push(action.payload);
        state.loading = false;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

// Extract actions
const {
  addSavedAddress,
  setDefaultAddress,
  setSearchQuery,
  setSearchResults,
  clearSearch,
  setCurrentAddress,
  clearCurrentAddress,
  setSelectedAddress,
} = addressSlice.actions;

// Export reducer as default
const addressReducer = addressSlice.reducer;

// Using ES modules export syntax for consistency
module.exports = addressReducer;
module.exports.fetchSavedAddresses = fetchSavedAddresses;
module.exports.addAddress = addAddress;
module.exports.addSavedAddress = addSavedAddress;
module.exports.setDefaultAddress = setDefaultAddress;
module.exports.setSearchQuery = setSearchQuery;
module.exports.setSearchResults = setSearchResults;
module.exports.clearSearch = clearSearch;
module.exports.setCurrentAddress = setCurrentAddress;
module.exports.clearCurrentAddress = clearCurrentAddress;
module.exports.setSelectedAddress = setSelectedAddress;