import { addPet } from './slices/petSlice';
import { addReceiver } from './slices/receiverSlice';
import { addAddress } from './slices/addressSlice';

const saveAddress = (address, receiver, pet) => (dispatch) => {

  const petId = Date.now().toString();
  const receiverId = (Date.now() + 1).toString();

  // Save pet
  dispatch(addPet({ ...pet, id: petId }));

  // Save receiver with petId
  dispatch(addReceiver({ ...receiver, id: receiverId, petId }));

  dispatch(addAddress({ ...address, receiverId, petId }));

  dispatch({ type: 'address/clearCurrentAddress' });
  dispatch({ type: 'receiver/clearCurrentReceiver' });
  dispatch({ type: 'pet/clearCurrentPet' });
};

export { saveAddress };