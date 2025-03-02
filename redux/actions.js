import { addPetAsync, updatePetAsync} from './slices/petSlice';
import { addReceiverAsync, updateReceiverAsync } from './slices/receiverSlice';
import { addAddress, updateAddress, setDefaultAddressAsync } from './slices/addressSlice';

const saveAddress = (address, receiver, pet) => async (dispatch) => {
  try {
    const petId = Date.now().toString();
    const receiverId = (Date.now() + 1).toString();
    const addressId = (Date.now() + 2).toString();

    console.log("address received", address)

    console.log("Saving with IDs - pet:", petId, "receiver:", receiverId, "address:", addressId);

    // Save pet with AsyncStorage
    
    
    await dispatch(addPetAsync({ ...pet, id: petId }));

    // Save receiver with AsyncStorage
    await dispatch(addReceiverAsync({ ...receiver, id: receiverId, petId }));

    // Save address with AsyncStorage
    if(address.defaultAddress){
      console.log("default selected", )
      dispatch(setDefaultAddressAsync(addressId));
    }
    await dispatch(addAddress({ ...address, id: addressId, receiverId, petId }));
    
    
  } catch (error) {
    console.error("Error saving address:", error);
  }
};

const updateCompleteAddress = (address, receiver, pet) => async (dispatch) => {
  try {
    // Ensure we have all required IDs
    if (!pet.id || !receiver.id || !address.id) {
      console.error("Missing IDs for update operation");
      return;
    }

    // Update pet with AsyncStorage
    await dispatch(updatePetAsync(pet));

    // Update receiver with AsyncStorage
    await dispatch(updateReceiverAsync(receiver));

    // Update address with AsyncStorage
    if(address.defaultAddress){
      dispatch(setDefaultAddressAsync(address.id));
    }
      await dispatch(updateAddress(address));
    
  } catch (error) {
    console.error("Error updating address:", error);
  }
};

const getAddressWithDetails = (addressId) => (state) => {
  console.log("Getting address details for ID:", addressId);
  console.log("Current state.address.savedAddresses:", state.address.savedAddresses);
  console.log("Current state.pet.pets:", state.pet.pets);
  console.log("Current state.receiver.receivers:", state.receiver.receivers);
  
  // Find the address by ID
  const address = state.address.savedAddresses.find(addr => addr.id === addressId);
  if (!address) return null;
  
  console.log("Looking for receiver with ID:", address.receiverId);
  // Find the connected receiver using the receiverId from the address
  const receiver = state.receiver.receivers.find(rec => rec.id === address.receiverId);
  console.log("Found receiver:", receiver);
  
  console.log("Looking for pet with ID:", address.petId);
  // Find the connected pet using the petId from the address
  const pet = state.pet.pets.find(p => p.id === address.petId);
  console.log("Found pet:", pet);
  
  // Return the complete object with all related data
  return {
    address,
    receiver,
    pet
  };
};

export { saveAddress, updateCompleteAddress, getAddressWithDetails };