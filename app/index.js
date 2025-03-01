import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import BottomButton from "components/BottomButton";
import { useDispatch } from "react-redux";
import { setSelectedAddress, fetchSavedAddresses } from "redux/slices/addressSlice";

export default function IndexScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [locationPermission, setLocationPermission] = useState(null);
  const { savedAddresses, loading } = useSelector((state) => state.address);



  useEffect(() => {
    const checkLocationPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
    };

    checkLocationPermission();

    console.log("savedAddresses", savedAddresses);
  }, []);

  useFocusEffect(
      useCallback(() => {
        dispatch(fetchSavedAddresses())
      }, [dispatch])
    );

  useEffect(() => {
    dispatch(fetchSavedAddresses())
  }, [dispatch]);


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

  const handleSelectAddress = (address) => {
    // Store selected address in AsyncStorage for use in next screen
    console.log("addrssssss", address)
    const selectedAddress = {
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
    dispatch(setSelectedAddress(selectedAddress));
    router.push("/address/map");
  };

  // Render saved address item
  const renderAddressItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.addressItem} 
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.addressIconContainer}>
        <Ionicons name="location" size={24} color="#E18336" />
      </View>
      <View style={styles.addressDetails}>
        <Text style={styles.addressName}>{item.formattedAddress}</Text>
        <Text style={styles.addressText} numberOfLines={1}>
          {item.fullAddress}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

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
  }
});