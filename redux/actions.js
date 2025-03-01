import { addPet } from './slices/petSlice';
import { addReceiver } from './slices/receiverSlice';
import { addAddress } from './slices/addressSlice';

const saveAddress = (address, receiver, pet) => (dispatch) => {
  console.log('saveAddress called with:', { address, receiver, pet });

  const petId = Date.now().toString();
  const receiverId = (Date.now() + 1).toString();

  // Save pet
  console.log('Dispatching addPet:', { ...pet, id: petId });
  dispatch(addPet({ ...pet, id: petId }));

  // Save receiver with petId
  console.log('Dispatching addReceiver:', { ...receiver, id: receiverId, petId });
  dispatch(addReceiver({ ...receiver, id: receiverId, petId }));

  // Save address with receiverId and petId
  console.log('Dispatching addSavedAddress:', { ...address, receiverId, petId });
  dispatch(addAddress({ ...address, receiverId, petId }));

  // Clear current states
  console.log('Clearing states');
  dispatch({ type: 'address/clearCurrentAddress' });
  dispatch({ type: 'receiver/clearCurrentReceiver' });
  dispatch({ type: 'pet/clearCurrentPet' });
};

export { saveAddress };