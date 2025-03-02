import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import BottomButton from "components/BottomButton";
import { useDispatch } from "react-redux";
import { setSelectedAddress, fetchSavedAddresses, removeAddress, fetchSavedDefaultId } from "redux/slices/addressSlice";
import {fetchPets} from "redux/slices/petSlice"
import {fetchReceivers} from "redux/slices/receiverSlice"
export default function IndexScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [locationPermission, setLocationPermission] = useState(null);
  const { savedAddresses, loading, defaultId } = useSelector((state) => state.address);



  useEffect(() => {
    const checkLocationPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
    };

    checkLocationPermission();
  }, []);

  const handleDeleteAddress = (addressId) => {
    dispatch(removeAddress(addressId))
      .then(() => {
        // Optional: Handle success (e.g., show toast notification)
        console.log('Address deleted successfully');
      })
      .catch((error) => {
        // Optional: Handle error
        console.error('Failed to delete address:', error);
      });
  };

  const lastFetchTimeRef = useRef(0);
const FETCH_COOLDOWN = 300; // milliseconds

const fetchAllData = useCallback(() => {
  const now = Date.now();
  
  // Only fetch if sufficient time has passed since last fetch
  if (now - lastFetchTimeRef.current > FETCH_COOLDOWN) {
    console.log('Fetching data from storage...');
    dispatch(fetchSavedAddresses());
    dispatch(fetchPets());
    dispatch(fetchReceivers());
    dispatch(fetchSavedDefaultId());
    
    lastFetchTimeRef.current = now;
  }
}, [dispatch]);

// On component mount
useEffect(() => {
  fetchAllData();
}, [fetchAllData]);

// When screen comes into focus
useFocusEffect(
  useCallback(() => {
    fetchAllData();
    return () => {
    };
  }, [fetchAllData])
);

  const getAddressTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'home':
        return 'home-outline';
      case 'office':
      case 'work':
        return 'business-outline';
      default:
        return 'location-outline';
    }
  };

  const getFormattedSubtitle = (address) => {
    // For map-added addresses\
    const isFromMap = Boolean(address.roadName || address.landmark || address.area || address.colony);
    if (isFromMap) {
      const parts = [];
      if (address.houseFlatNo) parts.push(`#${address.houseFlatNo}`);
      if (address.buildingNo) parts.push(address.buildingNo);
      if (address.roadName) parts.push(address.roadName);
      if (address.landmark) parts.push(`Near ${address.landmark}`);
      if (address.area || address.colony) parts.push([address.area, address.colony].filter(Boolean).join(', '));
      
      return parts.join(', ');
    }
    const parts = [];
    if (address.houseFlatNo) parts.push(`Flat #${address.houseFlatNo}`);
    if (address.buildingNo) parts.push(address.buildingNo);
    
    // If we have structured info, use it
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // If formattedAddress and fullAddress are different, show fullAddress
    if (address.fullAddress && address.formattedAddress !== address.fullAddress) {
      return address.fullAddress;
    }
    
    // Otherwise, don't show duplicate info (return empty to hide subtitle)
    return '';
  }



  const handleAddNewAddress = async () => {
    try {
      // Clear any previously selected address
      await AsyncStorage.removeItem('selectedAddress');
      
      // If permission already granted, go directly to map 
      if (locationPermission === "granted") {
        // Get user's current location
        router.push({
          pathname: "/address/map",
          params: { 
            isCurrentLocation: true
          }
        });
      } else {
        // Otherwise go to search page, which will handle permission request
        router.push("/address/search");
      }
    } catch (error) {
      console.error("Error handling add address:", error);
      // On error, default to search screen
      router.push("/address/search");
    }
  };

  const handleSelectAddress = async (address) => {
    const selectedAddress = {
      id : address.id,
      location: { latitude: address.latitude, longitude: address.longitude },
      formattedAddress: address.formattedAddress,
      fullAddress: address.fullAddress,
      details: {
        name: address.placeName,
        formatted_address: address.formattedAddress,
        place_id: address.placeId
      },
      source: 'search'
    };
    await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
    // dispatch(setSelectedAddress(selectedAddress));
    router.push({
      pathname: "/address/map",
      params: { 
        isCurrentLocation: false,
        isEditAddress : true,
        addressId : address.id
      }
    });
  };

  // Render saved address item
  const renderAddressItem = ({ item }) => {
    const subtitleText = getFormattedSubtitle(item);
    const isDefaultAddress = item.id === defaultId;
    console.log("defaultId", defaultId)
    return(
      <TouchableOpacity 
      style={[
        styles.addressContent, 
        isDefaultAddress && styles.defaultAddressContainer
      ]} 
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getAddressTypeIcon(item.addressType)} 
          size={22} 
          color="#E18336"
        />
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          {subtitleText ? (
            <Text 
              style={[
                styles.subtitle, 
              ]} 
              numberOfLines={1}
            >
              {subtitleText}
            </Text>
          ) : null}
          <Text 
            style={[
              styles.title, 
            ]} 
            numberOfLines={1}
          >
            {item.formattedAddress}
          </Text>
        </View>
      </View>
      
      {isDefaultAddress && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteAddress(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="trash-outline" 
          size={18} 
          color= "#EF4444"
        />
      </TouchableOpacity>
    </TouchableOpacity>
)};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Main content area */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E18336" />
          </View>
        ) : savedAddresses.length > 0 ? (
          <View style={styles.savedAddressesContainer}>
            <Text style={styles.sectionTitle}>Your saved addresses</Text>
            <FlatList
              data={savedAddresses}
              renderItem={renderAddressItem}
              keyExtractor={(item, index) => `address-${index}`}
              contentContainerStyle={styles.addressList}
            />
            <BottomButton   
              title="Add new address"
              onPress={handleAddNewAddress} />   
          
          </View>
        ) : (
          <View style={styles.emptyContainer}></View>
        )}
      </View>
      {!loading && savedAddresses.length === 0 && (
        <View style={styles.bottomButtonContainer}>
          <BottomButton 
            title="Add new address"
            onPress={handleAddNewAddress}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FB" // Light background color matching the design
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    // Empty as per design for new users
  },
  savedAddressesContainer: {
    flex: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1F2937"
  },
  addressList: {
    flexGrow: 1
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  addressIconContainer: {
    marginRight: 12
  },
  addressDetails: {
    flex: 1
  },
  addressName: {
    fontWeight: "500",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4
  },
  addressText: {
    color: "#6B7280",
    fontSize: 14
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E18336",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  addNewAddressText: {
    color: "#E18336",
    fontWeight: "500",
    marginLeft: 8
  },
  bottomButtonContainer: {
    padding: 16,
    paddingBottom: 24 // Extra padding at the bottom for better spacing
  },
  addAddressButton: {
    backgroundColor: "#E18336", // Orange color from the design
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500"
  },
  defaultAddressContainer: {
    borderColor: '#E18336', // Orange background for default address
    borderWidth: 1,
    borderRadius: 8,
  },
  defaultAddressTitle: {
    color: '#FFFFFF', // White text for default address
    fontWeight: '600',
  },
  defaultAddressSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)', // Slightly transparent white
  },
  defaultBadge: {
    backgroundColor: '#E18336', // Translucent white background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  }
});