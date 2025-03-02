import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import {saveAddress} from "../redux/actions";
import BottomButton from './BottomButton';

import { GOOGLE_PLACES_API_KEY } from '@env';

const AddressFormScreen = ({ navigation }) => {
    const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    houseFlat: '',
    building: '',
    name: '',
    mobile: '',
    petName: '',
    defaultAddress: true,
    addressType : "",
    buildingName:"",
    area : "",
    colony : "",
    houseFlatNo: "", // Map houseFlat to houseFlatNo
    buildingNo: "",
    roadName: "",
    landmark: "",
    latitude: "",
    longitude: "",
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleDefaultAddress = () => {
    setFormData(prev => ({
      ...prev,
      defaultAddress: !prev.defaultAddress
    }));
  };



  // Function to get coordinates from address components
const getCoordinatesFromAddress = async (pincode, city, state) => {
    try {
      // Format the address string
      const addressString = `${pincode}, ${city}, ${state}`;
      
      // Encode the address for URL
      const encodedAddress = encodeURIComponent(addressString);
      
      // Create the API URL
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_PLACES_API_KEY}`;
      
      // Make the API request
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if we got a valid response
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address,
          placeId: data.results[0].place_id
        };
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.pincode || !formData.city || !formData.houseFlat || !formData.name || !formData.mobile) {
      // You could add proper validation UI here
      alert('Please fill all required fields');
      return;
    }

    getCoordinatesFromAddress(formData.pincode, formData.city, formData.state)
      .then((location) => {
        if (location) {
            const updatedAddress = {
                pinCode: formData.pincode,
                city: formData.city,
                houseFlatNo: formData.houseFlat, // Map houseFlat to houseFlatNo
                buildingNo: formData.buildingNo,
                latitude: location.latitude,
                longitude: location.longitude,
                formattedAddress: location.formattedAddress,
                placeId: location.placeId,
              };
          
              const updatedReceiver = {
                name: formData.name,
                phoneNumber: formData.mobile, // Map mobile to phoneNumber
              };
          
              const updatedPet = {
                name: formData.petName,
              };
              // Save to Redux
              dispatch(saveAddress(updatedAddress, updatedReceiver, updatedPet));
        }});
   
    // Navigate back or to next screen
  };

  const handleBack = () => {
    // Navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}

      {/* Scrollable Middle Content */}
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.scrollContent}>
          {/* Location permission section */}
         

          {/* Address section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor="#9CA3AF"
                value={formData.pincode}
                onChangeText={(text) => handleChange('pincode', text)}
                keyboardType="numeric"
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={formData.city}
                  onChangeText={(text) => handleChange('city', text)}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  value={formData.state}
                  onChangeText={(text) => handleChange('state', text)}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="House/Flat no."
                placeholderTextColor="#9CA3AF"
                value={formData.houseFlat}
                onChangeText={(text) => handleChange('houseFlat', text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Building no."
                placeholderTextColor="#9CA3AF"
                value={formData.building}
                onChangeText={(text) => handleChange('building', text)}
              />
            </View>
          </View>

          {/* Receiver's details section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receiver's details</Text>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Your mobile no."
                placeholderTextColor="#9CA3AF"
                value={formData.mobile}
                onChangeText={(text) => handleChange('mobile', text)}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Your pet's name"
                placeholderTextColor="#9CA3AF"
                value={formData.petName}
                onChangeText={(text) => handleChange('petName', text)}
              />
            </View>
          </View>
          
          {/* Add padding at the bottom to ensure content isn't hidden behind footer */}
       
        </ScrollView>
    
      </View>
     

      {/* Fixed Footer */}
      <View style={styles.footer}>
        {/* Default address checkbox */}
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={toggleDefaultAddress}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox,
            formData.defaultAddress && styles.checkboxChecked
          ]}>
            {formData.defaultAddress && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Set as default address</Text>
        </TouchableOpacity>

        {/* Submit button */}
        <BottomButton title="Save Address" onPress={handleSubmit} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  contentWrapper: {
    flex: 1, 
    
  },
  scrollContent: { 
    flex: 1, 
  },

  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '325',
    marginBottom: 16,
    marginLeft: 16,
    color: '#000000',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 16,
    padding: 16,
    fontSize: 12,
    color: '#1F2937',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfInput: {
    flex: 0.48,
    marginBottom: 0,
  },
  // Footer Section
  footer: {
    height: 140,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: "auto",
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D97706',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D97706',
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddressFormScreen;