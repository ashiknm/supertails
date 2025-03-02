import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import 'react-native-get-random-values';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {calculateDistance} from "lib/utils";


// Import Address Form Component
import AddressFormComponent from "../../components/AddressForm";
import LocationPermission from "components/LocationPermission";
import SearchBar from "components/SearchBar";

// Update with your actual API key
import { GOOGLE_PLACES_API_KEY } from '@env';

export default function SearchScreen() {
  const router = useRouter();
  const [locationPermission, setLocationPermission] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // State to control showing the address form
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Helper function to calculate distance between two coordinates
  
 
  
  // Use Google Places API to get predictions with distance calculation
  const searchPlaces = async (text) => {
    if (!text || text.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Get current location to calculate distance
      let userLocation = null;
      if (locationPermission === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low, // Use low accuracy for faster response
          });
          userLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };
        } catch (error) {
          console.warn('Error getting current location for distance:', error);
        }
      }
      
      // Build the Google Places API URL for autocomplete
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&language=en`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        // Process each prediction to get details including coordinates for distance
        const predictionsWithDetails = await Promise.all(
          data.predictions.slice(0, 5).map(async (prediction) => {
            // Get place details for coordinates
            let coordinates = null;
            let distance = null;
            
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              if (detailsData.status === 'OK' && detailsData.result?.geometry?.location) {
                coordinates = {
                  latitude: detailsData.result.geometry.location.lat,
                  longitude: detailsData.result.geometry.location.lng
                };
                
                // Calculate distance if we have user location
                if (userLocation && coordinates) {
                  distance = calculateDistance(
                    userLocation.latitude, 
                    userLocation.longitude,
                    coordinates.latitude, 
                    coordinates.longitude
                  );
                }
              }
            } catch (error) {
              console.warn('Error getting place details:', error);
            }
            
            return {
              id: prediction.place_id,
              name: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
              address: prediction.structured_formatting?.secondary_text || prediction.description,
              description: prediction.description,
              place_id: prediction.place_id,
              coordinates,
              distance: distance || ""// Fallback to random if we couldn't get real distance
            };
          })
        );
        
        setSearchResults(predictionsWithDetails);
      } else {
        console.warn('Google Places API error:', data.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle text input changes
  const handleSearchTextChange = (text) => {
    setSearchText(text);
    searchPlaces(text);
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkLocationPermission();
    }, [])
  );

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  const handleEnableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === "granted") {
        await handleUseCurrentLocation();
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    } 
  };

  const handleUseCurrentLocation = async () => {
    router.push({
      pathname: "/address/map",
      params: { 
        isCurrentLocation: true
      }
    });
  };

  const handleSelectAddress = async (item) => {
    try {
      
      // Use coordinates if we already have them
      if (item.coordinates) {
        const selectedAddress = {
          location: item.coordinates,
          formattedAddress: item.name,
          fullAddress: item.address,
          details: {
            name: item.name,
            formatted_address: item.address,
            place_id: item.place_id
          },
          source: 'search'
        };
        
        await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
        
        // When you create your Redux slice, uncomment this:
        // dispatch(setSelectedAddress(selectedAddress));
        
        router.push("/address/map");
        return;
      }
      
      // Otherwise fetch place details using the place_id
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&fields=geometry,formatted_address,name,vicinity&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const details = data.result;
        const location = {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng
        };
        
        // Save to AsyncStorage
        const selectedAddress = {
          location,
          formattedAddress: item.name,
          fullAddress: details.formatted_address || item.address,
          details: details,
          source: 'search'
        };
        
        await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
        
        // When you create your Redux slice, uncomment this:
        // dispatch(setSelectedAddress(selectedAddress));
        
        router.push("/address/map");
      } else {
        console.warn('Google Places Details API error:', data.status);
      }
    } catch (error) {
      console.error("Error handling selected address:", error);
    } 
  };

  const handleManualEntry = () => {
    // Instead of navigating, show the address form component
    setShowAddressForm(true);
  };

  const handleAddressFormSubmit = (formData) => {
    // Handle the submitted form data - you might want to save it to AsyncStorage or dispatch to Redux
    
    // Example implementation:
    const selectedAddress = {
      formattedAddress: `${formData.houseFlat}, ${formData.building}`,
      fullAddress: `${formData.houseFlat}, ${formData.building}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
      details: {
        name: formData.name,
        phone: formData.mobile,
        petName: formData.petName,
        isDefault: formData.defaultAddress
      },
      source: 'manual'
    };
    
    // Save to AsyncStorage (async operation, but we're not awaiting it here for simplicity)
    AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
    
    // Reset the form view and navigate as needed
    setShowAddressForm(false);
    router.push("/address/map");
  };

  const handleCancelForm = () => {
    // Hide the address form component
    setShowAddressForm(false);
  };

  const renderSearchResults = () => {
    if (searchText.length === 0) return null;
    
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E18336" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }
    
    if (searchResults.length === 0) {
      return <Text style={styles.noResultsText}>No results found</Text>;
    }
    
    return (
      <View>
        <Text style={styles.resultsHeader}>SEARCH RESULTS</Text>
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.addressItem}
              onPress={() => handleSelectAddress(item)}
            >
              <View style={styles.addressIcon}>
                <Ionicons name="location-outline" size={24} color="#4B5563" />
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{item.name}</Text>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>
              <Text style={styles.distanceText}>{item.distance}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Render the appropriate content based on the showAddressForm state
  const renderContent = () => {
    if (showAddressForm) {
      return (
        <AddressFormComponent 
          onSubmit={handleAddressFormSubmit}
          locationPermission={locationPermission}
          onEnableLocation={handleEnableLocation}
        />
      );
    }

    return (
      <View style={styles.content}>
        <View style={styles.contentWrapper}>
          <SearchBar 
            value={searchText}
            onChangeText={handleSearchTextChange}
            onClear={() => {
              setSearchText("");
              setSearchResults([]);
            }}
            placeholder="Search for area, street name..."
            autoFocus={true}
            returnKeyType="search"
            selectionColor="#E18336"
            onSubmitEditing={() => {
                setSearchText("");
                setSearchResults([]);
              }}
          
          />
         

          {locationPermission === 'granted' && 
            <TouchableOpacity 
              style={styles.useLocatiionDiv}
              onPress={handleUseCurrentLocation}
            >
              <View style={styles.locationInfo}>
                <Text style={styles.manualEntryText}>
                <Ionicons name="location-outline" size={22} color="#EF6C00" />
                Use current location</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#374151" />
            </TouchableOpacity>
          }
          <View style={styles.resultsContainer}>
            {renderSearchResults()}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.manualEntryButton}
          onPress={handleManualEntry}
        >
          <Ionicons name="add-circle-outline" size={22} color="#E18336" />
          <Text style={styles.manualEntryText}>Add address manually</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Title */}
      <View style={styles.headerContainer}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={showAddressForm ? handleCancelForm : () => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add address</Text>
        </View>
      </View>
      {locationPermission !== 'granted' &&
      <LocationPermission
          title="Enable location permission"
          subtitle="Your precise location helps us deliver on time"
          iconName="location-outline"
          buttonText="Enable"
          style={styles.header}
          onEnable={handleEnableLocation}
        />
      }
      
      {/* Main Content - conditionally render based on state */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 0
  },
  contentWrapper: {
    flex: 1, // Takes all available space between header and footer
    paddingHorizontal: 16,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  noResultsText: {
    padding: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addressIcon: {
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  useLocatiionDiv: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.4,
    borderBottomColor: '#00000033',
    marginBottom: 12,
  },
  manualEntryText: {
    color: '#E18336',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});