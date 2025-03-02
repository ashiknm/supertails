import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunk to fetch pets
const fetchPets = createAsyncThunk(
  'pet/fetchPets',
  async (_, { rejectWithValue }) => {
    try {
      const petsJSON = await AsyncStorage.getItem('savedPets');
      return petsJSON ? JSON.parse(petsJSON) : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to save pets to AsyncStorage
const savePetsToStorage = async (pets) => {
  try {
    await AsyncStorage.setItem('savedPets', JSON.stringify(pets));
    console.log("Saved pets to AsyncStorage:", pets);
  } catch (error) {
    console.error("Error saving pets to AsyncStorage:", error);
  }
};

const initialState = {
  pets: [],
  loading: false,
  error: null,
  currentPet: {
    name: '',
  },
};

const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    addPet: (state, action) => {
      state.pets.push({ ...action.payload });
      // Don't do AsyncStorage here - it's async
    },
    updatePet: (state, action) => {
      const index = state.pets.findIndex((pet) => pet.id === action.payload.id);
      if (index !== -1) state.pets[index] = action.payload;
    },
    removePet: (state, action) => {
      state.pets = state.pets.filter((pet) => pet.id !== action.payload);
    },
    setCurrentPet: (state, action) => {
      state.currentPet = { ...state.currentPet, ...action.payload };
    },
    clearCurrentPet: (state) => {
      state.currentPet = initialState.currentPet;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.pets = action.payload;
        state.loading = false;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

// Thunk to add a pet with AsyncStorage
const addPetAsync = (pet) => async (dispatch, getState) => {
  dispatch(addPet(pet));
  const { pet: petState } = getState();
  await savePetsToStorage(petState.pets);
};

// Thunk to update a pet with AsyncStorage
const updatePetAsync = (pet) => async (dispatch, getState) => {
  dispatch(updatePet(pet));
  const { pet: petState } = getState();
  await savePetsToStorage(petState.pets);
};

// Thunk to remove a pet with AsyncStorage
const removePetAsync = (petId) => async (dispatch, getState) => {
  dispatch(removePet(petId));
  const { pet: petState } = getState();
  await savePetsToStorage(petState.pets);
};

const { addPet, updatePet, removePet, setCurrentPet, clearCurrentPet } = petSlice.actions;

module.exports = petSlice.reducer;
module.exports.fetchPets = fetchPets;
module.exports.addPetAsync = addPetAsync;
module.exports.updatePetAsync = updatePetAsync;
module.exports.removePetAsync = removePetAsync;
module.exports.addPet = addPet;
module.exports.updatePet = updatePet;
module.exports.removePet = removePet;
module.exports.setCurrentPet = setCurrentPet;
module.exports.clearCurrentPet = clearCurrentPet;