const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  enabled: false,
  coordinates: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocationEnabled: (state, action) => {
      state.enabled = action.payload;
    },
    setCoordinates: (state, action) => {
      state.coordinates = action.payload;
    },
    clearLocation: () => initialState,
  },
});

const { setLocationEnabled, setCoordinates, clearLocation } = locationSlice.actions;

module.exports = locationSlice.reducer;
module.exports.setLocationEnabled = setLocationEnabled;
module.exports.setCoordinates = setCoordinates;
module.exports.clearLocation = clearLocation;