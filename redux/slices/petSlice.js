const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  pets: [],
  currentPet: {
    name: '',
  },
};

const petSlice = createSlice({
  name: 'pet',
  initialState,
  reducers: {
    addPet: (state, action) => {
      state.pets.push({ ...action.payload, id: Date.now().toString() });
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
});

const {
  addPet,
  updatePet,
  removePet,
  setCurrentPet,
  clearCurrentPet,
} = petSlice.actions;

module.exports = petSlice.reducer;
module.exports.addPet = addPet;
module.exports.updatePet = updatePet;
module.exports.removePet = removePet;
module.exports.setCurrentPet = setCurrentPet;
module.exports.clearCurrentPet = clearCurrentPet;