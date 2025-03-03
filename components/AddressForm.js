import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { saveAddress } from "../redux/actions";
import { setSelectedAddress } from "../redux/slices/addressSlice";
import BottomButton from './BottomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { GOOGLE_PLACES_API_KEY } from '@env';

const AddressFormScreen = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
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
    addressType: "home",
    buildingName: "",
    area: "",
    colony: "",
    houseFlatNo: "", 
    buildingNo: "",
    roadName: "",
    landmark: "",
    latitude: "",
    longitude: "",
  });

  // Form errors state
  const [errors, setErrors] = useState({});
  
  // Loading states
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (name, value) => {
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Special handling for pincode
    if (name === 'pincode') {
      // Only allow numeric input
      if (value !== '' && !/^\d+$/.test(value)) {
        return; // Ignore non-numeric input
      }
      
      // Clear city and state if pincode is cleared
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          city: '',
          state: ''
        }));
        return;
      }
      
      // If pincode is 6 digits, fetch city and state
      if (value.length === 6) {
        fetchLocationFromPincode(value);
      }
    }
    
    // Special handling for mobile, building and houseFlat
    if (['mobile', 'building', 'houseFlat'].includes(name)) {
      // Only allow numeric input for these fields
      if (value !== '' && !/^\d+$/.test(value)) {
        return; // Ignore non-numeric input
      }
    }
    
    // Update the form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch city and state from pincode
  const fetchLocationFromPincode = async (pincode) => {
    try {
      setIsPincodeLoading(true);
      setErrors(prev => ({ ...prev, pincode: '' }));
      
      // API URL for pincode lookup
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode}&components=country:IN&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Extract city and state from address components
        const addressComponents = data.results[0].address_components;
        let city = '';
        let state = '';
        
        addressComponents.forEach(component => {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        });
        
        if (city && state) {
          setFormData(prev => ({
            ...prev,
            city,
            state
          }));
        } else {
          setErrors(prev => ({ 
            ...prev, 
            pincode: 'Could not find location details for this PIN code' 
          }));
        }
      } else {
        setErrors(prev => ({ 
          ...prev, 
          pincode: 'Invalid PIN code' 
        }));
      }
    } catch (error) {
      console.error('Error fetching location from pincode:', error);
      setErrors(prev => ({ 
        ...prev, 
        pincode: 'Error fetching location data' 
      }));
    } finally {
      setIsPincodeLoading(false);
    }
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

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Validate Pincode
    if (!formData.pincode) {
      newErrors.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'PIN code must be 6 digits';
    }
    
    // Validate City and State
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    
    // Validate House/Flat number
    if (!formData.houseFlat) {
      newErrors.houseFlat = 'House/Flat number is required';
    } else if (!/^\d+$/.test(formData.houseFlat)) {
      newErrors.houseFlat = 'House/Flat number must contain only digits';
    }
    
    // Validate Building number if provided
    if (formData.building && !/^\d+$/.test(formData.building)) {
      newErrors.building = 'Building number must contain only digits';
    }
    
    // Validate Receiver's details
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    
    if (!formData.petName) {
      newErrors.petName = 'Pet name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to the first error field (you'd need to implement this)
      Alert.alert('Form Error', 'Please fix the errors in the form before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const location = await getCoordinatesFromAddress(
        formData.pincode, 
        formData.city, 
        formData.state
      );
      
      if (location) {
        const updatedAddress = {
          pinCode: formData.pincode,
          city: formData.city,
          state: formData.state,
          houseFlatNo: formData.houseFlat,
          buildingNo: formData.building,
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.formattedAddress,
          placeId: location.placeId,
          addressType: formData.addressType || "home",
          defaultAddress: formData.defaultAddress
        };
        
        const updatedReceiver = {
          name: formData.name,
          phoneNumber: formData.mobile,
        };
        
        const updatedPet = {
          name: formData.petName,
        };
        
        // Save to Redux
        dispatch(saveAddress(updatedAddress, updatedReceiver, updatedPet));
        // Navigate to home screen
        router.push("/")
      } else {
        Alert.alert(
          'Location Error', 
          'Could not determine the coordinates for this address. Please check your address details.'
        );
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      Alert.alert('Error', 'An error occurred while saving the address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable Middle Content */}
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.scrollContent}>
          {/* Address section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.formContainer}>
              <View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.pincode ? styles.inputError : null
                    ]}
                    placeholder="Pincode * (Numbers only)"
                    placeholderTextColor="#9CA3AF"
                    value={formData.pincode}
                    onChangeText={(text) => handleChange('pincode', text)}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {isPincodeLoading && (
                    <ActivityIndicator 
                      size="small" 
                      color="#D97706" 
                      style={styles.inputIcon}
                    />
                  )}
                </View>
                {errors.pincode && (
                  <Text style={styles.errorText}>{errors.pincode}</Text>
                )}
              </View>

              <View style={styles.rowInputs}>
                <View style={{flex: 0.48}}>
                  <TextInput
                    style={[
                      styles.input, 
                      errors.city ? styles.inputError : null,
                      {marginBottom: 0}
                    ]}
                    placeholder="City *"
                    placeholderTextColor="#9CA3AF"
                    value={formData.city}
                    onChangeText={(text) => handleChange('city', text)}
                    editable={false}
                  />
                  {errors.city && (
                    <Text style={styles.errorText}>{errors.city}</Text>
                  )}
                </View>
                
                <View style={{flex: 0.48}}>
                  <TextInput
                    style={[
                      styles.input, 
                      errors.state ? styles.inputError : null,
                      {marginBottom: 0}
                    ]}
                    placeholder="State *"
                    placeholderTextColor="#9CA3AF"
                    value={formData.state}
                    onChangeText={(text) => handleChange('state', text)}
                    editable={false}
                  />
                  {errors.state && (
                    <Text style={styles.errorText}>{errors.state}</Text>
                  )}
                </View>
              </View>

              <View>
                <TextInput
                  style={[
                    styles.input,
                    errors.houseFlat ? styles.inputError : null
                  ]}
                  placeholder="House/Flat no. * (Numbers only)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.houseFlat}
                  onChangeText={(text) => handleChange('houseFlat', text)}
                  keyboardType="numeric"
                />
                {errors.houseFlat && (
                  <Text style={styles.errorText}>{errors.houseFlat}</Text>
                )}
              </View>

              <View>
                <TextInput
                  style={[
                    styles.input,
                    errors.building ? styles.inputError : null
                  ]}
                  placeholder="Building no. (Numbers only)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.building}
                  onChangeText={(text) => handleChange('building', text)}
                  keyboardType="numeric"
                />
                {errors.building && (
                  <Text style={styles.errorText}>{errors.building}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Receiver's details section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receiver's details</Text>
            <View style={styles.formContainer}>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    errors.name ? styles.inputError : null
                  ]}
                  placeholder="Your name *"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View>
                <TextInput
                  style={[
                    styles.input,
                    errors.mobile ? styles.inputError : null
                  ]}
                  placeholder="Your mobile no. * (10 digits)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.mobile}
                  onChangeText={(text) => handleChange('mobile', text)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.mobile && (
                  <Text style={styles.errorText}>{errors.mobile}</Text>
                )}
              </View>

              <View>
                <TextInput
                  style={[
                    styles.input,
                    errors.petName ? styles.inputError : null
                  ]}
                  placeholder="Your pet's name *"
                  placeholderTextColor="#9CA3AF"
                  value={formData.petName}
                  onChangeText={(text) => handleChange('petName', text)}
                />
                {errors.petName && (
                  <Text style={styles.errorText}>{errors.petName}</Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Add padding at the bottom to ensure content isn't hidden behind footer */}
          <View style={{height: 20}} />
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
        <BottomButton 
          title="Save Address" 
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
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
  inputWrapper: {
    position: 'relative',
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
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
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