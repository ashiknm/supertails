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
      const newAddress = { ...address };
      const { address: addressState } = getState();
      const updatedAddresses = [...addressState.savedAddresses, newAddress];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));

      console.log("new-address", newAddress)

      const location = {
        latitude: newAddress.latitude,
        longitude: newAddress.longitude
      };
      
      // Save to AsyncStorage
      const selectedAddress = {
        location,
        formattedAddress: address.formattedAddress,
        fullAddress: address.fullAddress,
        details: {
          name: address.placeName,
          formatted_address: address.formattedAddress,
          place_id: address.placeId
        },
        source: 'add'
      };
      
      await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));

      
      return newAddress;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const removeAddress = createAsyncThunk(
  'address/removeAddress',
  async (addressId, { getState, rejectWithValue }) => {
    try {
      const { address: addressState } = getState();
      const updatedAddresses = addressState.savedAddresses.filter(
        address => address.id !== addressId
      );
      
      // Save updated list to AsyncStorage
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      
      return addressId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to set default address
const setDefaultAddressAsync = createAsyncThunk(
  'address/setDefaultAddressAsync',
  async (addressId, { dispatch }) => {
    try {
      // Convert to string explicitly
      await AsyncStorage.setItem('defaultId', JSON.stringify(addressId));
      
      // Update Redux state using the existing action
      dispatch(setDefaultAddress(addressId));
      
      return addressId;
    } catch (error) {
      console.error('Error setting default address:', error);
      return rejectWithValue(error.message);
    }
  }
);

const fetchSavedDefaultId = createAsyncThunk(
  'address/fetchSavedDefault',
  async (_, { rejectWithValue }) => {
    try {
      const defaultId = await AsyncStorage.getItem('defaultId');
      
      // Explicitly parse and handle null/undefined cases
      if (defaultId) {
        return JSON.parse(defaultId);
      }
      
      return ''; // Return empty string if no default found
    } catch (error) {
      console.error('Error fetching default address:', error);
      return rejectWithValue(error.message);
    }
  }
);

const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async (updatedAddress, { getState, rejectWithValue }) => {
    try {
      const { address: addressState } = getState();
      const updatedAddresses = addressState.savedAddresses.map(address => 
        address.id === updatedAddress.id ? updatedAddress : address
      );
      
      // Save updated list to AsyncStorage
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      
      return updatedAddress;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  savedAddresses: [], 
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
    buildingName : '',
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
      const newAddress = { ...action.payload };
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
    // Add these to your reducers section
  removeSavedAddress: (state, action) => {
    state.savedAddresses = state.savedAddresses.filter(
      address => address.id !== action.payload
    );
    // If we're removing the default address, clear the defaultId
    if (state.defaultId === action.payload) {
      state.defaultId = null;
    }
  },
  updateSavedAddress: (state, action) => {
    const index = state.savedAddresses.findIndex(
      address => address.id === action.payload.id
    );
    if (index !== -1) {
      state.savedAddresses[index] = action.payload;
    }
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
      })

      .addCase(removeAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.savedAddresses = state.savedAddresses.filter(
          address => address.id !== action.payload
        );
        // If we're removing the default address, clear the defaultId
        if (state.defaultId === action.payload) {
          state.defaultId = null;
        }
        state.loading = false;
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.savedAddresses.findIndex(
          address => address.id === action.payload.id
        );
        if (index !== -1) {
          state.savedAddresses[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      builder
      .addCase(fetchSavedDefaultId.fulfilled, (state, action) => {
        state.defaultId = action.payload;
      })
      .addCase(setDefaultAddressAsync.fulfilled, (state, action) => {
        state.defaultId = action.payload;
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
  removeSavedAddress,
  updateSavedAddress
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
module.exports.removeAddress = removeAddress;
module.exports.updateAddress = updateAddress;
module.exports.removeSavedAddress = removeSavedAddress;
module.exports.updateSavedAddress = updateSavedAddress;
module.exports.setDefaultAddressAsync = setDefaultAddressAsync;
module.exports.fetchSavedDefaultId = fetchSavedDefaultId;