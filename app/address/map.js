import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet , Animated} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
// Import your actions when you create the Redux slice
// import { updateSelectedAddress } from "../../redux/slices/addressSlice";
import BottomSheet from "components/AddressDetails";
import BottomButton from "components/BottomButton";
import {handleChangeAddress} from "lib/utils";
import LocationNamePlate from "components/LocationNamePlate";

import { GOOGLE_PLACES_API_KEY } from '@env';

export default function MapScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);

  const [markerLocation, setMarkerLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [showEnableLocationSuccess, setShowEnableLocationSuccess] = useState(false);

  const [showDetailsSheet, setShowDetailsSheet] = useState(false);

  // Map view animation reference (to be used by MapScreen)
  const mapAnimatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        setIsLoading(true);
        
        // Check location permission status first
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status);
        
        // Try to load the selected address from AsyncStorage
        const savedAddressJson = await AsyncStorage.getItem('selectedAddress');
        
        if (savedAddressJson) {
          // We have a previously selected address
          const savedAddress = JSON.parse(savedAddressJson);
          setSelectedAddress(savedAddress);
          
          if (savedAddress.location) {
            // Set marker and region to the selected address location
            setMarkerLocation(savedAddress.location);
            setRegion({
              ...savedAddress.location,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        }
        
        // If no saved address and location permission is granted, try to get current location
        if (!savedAddressJson && status === 'granted') {
          await getUserLocation();
        } else {
          // No saved address and no location permission
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading selected address:", error);
        setErrorMsg(`Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    loadSelectedAddress();
  }, []);

  useEffect(() => {
    const handleUseCurrentLocation = async () => {
        try {
          setMapReady(false);
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = location.coords;
          
          // Get address from coordinates
          const response = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          if (response && response.length > 0) {
            const address = response[0];
            const name = address.name || address.street || 'Current Location';
            const formattedAddress = name;
            const fullAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
            
            // Save to AsyncStorage
            const selectedAddress = {
              location: { latitude, longitude },
              formattedAddress,
              fullAddress,
              details: address,
              source: 'device'
            };

            
            setSelectedAddress(selectedAddress);
            
            await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
            
            // When you create your Redux slice, uncomment this:
            // dispatch(setSelectedAddress(selectedAddress));
            
          }
        } catch (error) {
          console.error("Error getting current location:", error);
        } finally {
            setMapReady(true);
        }
      };
      if(router.params?.isCurrentLocation) {
        handleUseCurrentLocation();
      }
  }, [router.params])
  


  const handleUseCurrentLocation = async () => {
    if (locationPermission === 'granted') {
      setIsLoading(true);
      await getUserLocation();
    } else {
      handleEnableLocation();
    }
  };

  
  const handleRegionChangeComplete = async (newRegion) => {
    if (!mapReady) return; // Skip if map isn't ready yet
    
    // Update marker to center of map
    const newLocation = {
      latitude: newRegion.latitude,
      longitude: newRegion.longitude
    };
    
    setMarkerLocation(newLocation);
    
    // Use Google Places Reverse Geocoding API
    try {
      const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLocation.latitude},${newLocation.longitude}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Get the most precise location type (prefer street_address or route)
        const addressComponents = data.results[0];
        const formattedAddress = addressComponents.formatted_address;
        
        // Try to extract meaningful components
        let name = '';
        let streetName = '';
        let cityName = '';
        let stateName = '';
        
        addressComponents.address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number') || types.includes('route')) {
            streetName = component.long_name;
          }
          
          if (types.includes('locality')) {
            cityName = component.long_name;
          }
          
          if (types.includes('administrative_area_level_1')) {
            stateName = component.short_name;
          }
        });
        
        // Prioritize naming
        if (streetName) {
          name = streetName;
        } else if (cityName) {
          name = cityName;
        } else {
          name = formattedAddress.split(',')[0].trim();
        }
        
        // Update selected address
        setSelectedAddress(prev => ({
          ...prev || {}, // Handle case where prev might be null
          location: newLocation,
          formattedAddress: name,
          fullAddress: formattedAddress,
          details: addressComponents
        }));
      } else {
        // Fallback if no results found
        console.warn('No address found for this location');
        setSelectedAddress(prev => ({
          ...prev || {},
          location: newLocation,
          formattedAddress: 'Unknown Location',
          fullAddress: `Lat: ${newLocation.latitude}, Lng: ${newLocation.longitude}`,
          details: null
        }));
      }
    } catch (error) {

      setSelectedAddress(prev => ({
        ...prev || {},
        location: newLocation,
        formattedAddress: 'Unknown Location',
        fullAddress: `Lat: ${newLocation.latitude}, Lng: ${newLocation.longitude}`,
        details: null
      }));
    }
  };


  const handleAddMoreDetails = () => {
    if (!selectedAddress) {
      // If no address is selected yet, prompt user to enable location or search
      if (locationPermission !== 'granted') {
        handleEnableLocation();
      } else {
        handleUseCurrentLocation();
      }
      return;
    }
    
    // Show the address details sheet
    setShowDetailsSheet(true);
  };
  // Function to animate to selected location when map becomes ready
  useEffect(() => {
    if (mapReady && mapRef.current && region) {
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [mapReady, region]);

  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      // Set marker and region to user's current location
      setMarkerLocation(userLocation);
      setRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
      // Get address from coordinates
      const response = await Location.reverseGeocodeAsync(userLocation);
      if (response && response.length > 0) {
        const address = response[0];
        const name = address.name || address.street || 'Current Location';
        const formattedAddress = name;
        const fullAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
        
        // Update selected address with current location
        const updatedAddress = {
          location: userLocation,
          formattedAddress: formattedAddress,
          fullAddress: fullAddress,
          details: address,
          source: 'device'
        };
        
        setSelectedAddress(updatedAddress);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('selectedAddress', JSON.stringify(updatedAddress));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleEnableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(status);
        setShowEnableLocationSuccess(true);
        
        // Hide the success message after 2 seconds
        setTimeout(() => {
          setShowEnableLocationSuccess(false);
        }, 2000);
        
        // Update location
        await getUserLocation();
      } else {
        setErrorMsg('Location permission denied');
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setErrorMsg(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Animated.View 
  style={[
    styles.mapContainer, 
    { transform: [{ translateY: mapAnimatedValue }],
    height: showDetailsSheet ? '35%' : '100%',
      minHeight: 100 
}
  ]}
>
<View style={styles.container}>
      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E18336" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) :
        
        locationPermission !== 'granted' && !selectedAddress ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="location" size={60} color="#E18336" style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>No location selected</Text>
              <Text style={styles.emptyStateText}>
                Please enable location services or search for an address to continue
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleEnableLocation}
              >
                <Text style={styles.emptyStateButtonText}>Enable Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptyStateSearchButton}
                onPress={handleChangeAddress}
              >
                <Text style={styles.emptyStateSearchText}>Search for address</Text>
              </TouchableOpacity>
            </View>
          )
        
        
        : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              onRegionChangeComplete={handleRegionChangeComplete}
              onMapReady={() => {
                setMapReady(true);
              }}
              showsUserLocation={locationPermission === 'granted'}
              showsMyLocationButton={true}
            >
              {mapReady && markerLocation && (
                <Marker
                  coordinate={markerLocation}
                  draggable={false}
                />
              )}
            </MapView>
            
            <View style={styles.searchContainer}>
              <TouchableOpacity 
                style={styles.searchBar}
                onPress={handleChangeAddress}
                activeOpacity={0.9}
              >
                <Ionicons name="search" size={20} color="#6B7280" />
                <Text style={styles.searchText}>Search area, street, name...</Text>
              </TouchableOpacity>
              
              {/* Location permission banner - only show when permission not granted */}
              {locationPermission !== 'granted' && (
                <View style={styles.locationPermissionContainer}>
                  <View style={styles.locationInfoContainer}>
                    <Ionicons name="navigate-outline" size={22} color="#000" />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationTitle}>Use current location</Text>
                      <Text style={styles.locationSubtitle}>Your precise location helps us deliver on time</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.enableButton}
                    onPress={handleEnableLocation}
                  >
                    <Text style={styles.enableButtonText}>Enable</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Success Toast - only shown temporarily after enabling location */}
            {showEnableLocationSuccess && (
              <View style={styles.successToastContainer}>
                <View style={styles.successToast}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.successToastText}>Location enabled successfully</Text>
                </View>
              </View>
            )}
            
            <View style={styles.tooltipContainer}>
              <View style={styles.tooltip}>
                <Text style={styles.tooltipTitle}>Order will be delivered here</Text>
                <Text style={styles.tooltipSubtitle}>Move the pin to change location</Text>
              </View>
            </View>
            
            {locationPermission !== 'granted' && (
              <View style={styles.floatingButtonContainer}>
                <TouchableOpacity
                  style={styles.floatingButton}
                  onPress={handleUseCurrentLocation}
                >
                  <Ionicons name="navigate-outline" size={20} color="#E18336" />
                  <Text style={styles.floatingButtonText}>Use current location</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Bottom Panel - only show if we have a selected address */}
      {selectedAddress && !showDetailsSheet && (
  <View style={styles.bottomPanel}>
    <LocationNamePlate
      selectedAddress={selectedAddress}
      onChangePress={handleChangeAddress}
    />

    <BottomButton 
            title="Add more address details"
            onPress={handleAddMoreDetails}
          />
  </View>
)}

      {/* Address Details Sheet */}
      <BottomSheet
  visible={showDetailsSheet}
  onClose={() => setShowDetailsSheet(false)}
  selectedAddress={selectedAddress}
  mapAnimatedValue={mapAnimatedValue}
/>
    </View>
</Animated.View>
  
  );
}

const styles = StyleSheet.create({
  container: {
    flex : 1,
    backgroundColor: 'white',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    color: '#DC2626'
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6'
  },
  loadingText: {
    marginTop: 10,
    color: '#4B5563'
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  emptyStateIcon: {
    marginBottom: 16
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  },
  emptyStateButton: {
    backgroundColor: '#E18336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center'
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16
  },
  emptyStateSearchButton: {
    borderWidth: 1,
    borderColor: '#E18336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  emptyStateSearchText: {
    color: '#E18336',
    fontWeight: '500',
    fontSize: 16
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  searchText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14
  },
  locationPermissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000'
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  enableButton: {
    backgroundColor: '#E18336',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  enableButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14
  },
  successToastContainer: {
    position: 'absolute',
    top: 70, // Below the search bar and permission banner
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  successToastText: {
    marginLeft: 8,
    color: '#1F2937',
    fontWeight: '500'
  },
  tooltipContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80, // Offset from center
  },
  tooltip: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%'
  },
  tooltipTitle: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15
  },
  tooltipSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E18336'
  },
  floatingButtonText: {
    color: '#E18336',
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14
  },
  bottomPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  locationIconContainer: {
    marginRight: 12,
    marginTop: 2
  },
  addressDetails: {
    flex: 1
  },
  addressName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  changeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  changeButtonText: {
    color: '#E18336',
    fontSize: 14,
    fontWeight: '500'
  },
});