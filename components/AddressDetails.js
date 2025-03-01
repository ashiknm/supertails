import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { saveAddress } from "../redux/actions";
import { useRouter } from "expo-router";
import BottomButton from "./BottomButton";
import LocationNamePlate from "./LocationNamePlate";
import { handleChangeAddress } from "lib/utils";

const windowHeight = Dimensions.get('window').height;
const sheetHeight = windowHeight * 0.70; 

const BottomSheet = ({ visible, onClose, selectedAddress, mapAnimatedValue }) => {

  const getPinCode = () => selectedAddress.details.address_components.find(comp => comp.types.includes('postal_code'))?.long_name || '';
  const getCity = () => selectedAddress.details.address_components.find(comp => comp.types.includes('locality'))?.long_name || '';
  const getState = () => selectedAddress.details.address_components.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || '';
  const getRoadName = () => selectedAddress.details.address_components.find(comp => comp.types.includes('route'))?.long_name || selectedAddress.details.formatted_address.split(',')[0] || '';
  const getArea = () => selectedAddress.details.address_components.find(comp => comp.types.includes('sublocality'))?.long_name || '';
  const getFormattedAddress = () => {return selectedAddress?.details?.formatted_address || '';};
  const getFullAddress = () => selectedAddress?.fullAddress || '';
  const getPlaceName = () => selectedAddress?.formattedAddress || '';
  const getPlaceId = () => selectedAddress?.details?.place_id || '';

  const [addressType, setAddressType] = useState("office");
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [petName, setPetName] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Animation configuration
  const animatedValue = useRef(new Animated.Value(sheetHeight)).current;
  
  useEffect(() => {
    if (visible) {
      // Animate the sheet up
      animatedValue.setValue(sheetHeight);
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Animate the map view up
      Animated.timing(mapAnimatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate the sheet down
      Animated.timing(animatedValue, {
        toValue: sheetHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Animate the map view back
      Animated.timing(mapAnimatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, mapAnimatedValue]);

  // Load saved address details if any
  useEffect(() => {
    if (visible && selectedAddress?.details) {
      setHouseNumber(selectedAddress.details.houseNumber || "");
      setBuildingName(selectedAddress.details.buildingName || "");
      setLandmark(selectedAddress.details.landmark || "");
      setAddressType(selectedAddress.details.type || "office");
      setReceiverName(selectedAddress.details.receiverName || "");
      setReceiverPhone(selectedAddress.details.receiverPhone || "");
      setPetName(selectedAddress.details.petName || "");
    }
    console.log("selected address", selectedAddress)
  }, [visible, selectedAddress]);

  const handleSaveAddress = async () => {
    if(!houseNumber || !buildingName || !landmark || !receiverName || !receiverPhone || !petName) {
      alert("Please fill all the fields");
      return;
    }
    try {
      if (!selectedAddress) return;
      const updatedAddress = {
        pinCode:  getPinCode(),
        city: getCity(),
        state: getState(),
        houseFlatNo: houseNumber,
        buildingNo: buildingName,
        roadName: getRoadName(),
        area: getArea(),
        colony: '', 
        landmark,
        addressType,
        latitude: selectedAddress.location?.latitude || null,
        longitude: selectedAddress.location?.longitude || null,
        formattedAddress : getFormattedAddress(),
        fullAddress : getFullAddress(),
        placeName : getPlaceName(),
        placeId : getPlaceId()
      };

      const updatedReceiver = {
        name: receiverName,
        phoneNumber: receiverPhone,
      };

      const updatedPet = {
        name: petName,
      };

      dispatch(saveAddress(updatedAddress, updatedReceiver, updatedPet));
      onClose();
      router.push('/'); 
    } catch (error) {
      console.error("Error saving address details:", error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: animatedValue }],
        }
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Location</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <LocationNamePlate  selectedAddress={selectedAddress} onClose={onClose} onChangePress={handleChangeAddress} />

          <Text style={styles.sectionTitle}>Enter complete address</Text>
          
          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="House No./Flat No."
              value={houseNumber}
              onChangeText={setHouseNumber}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Building name"
              value={buildingName}
              onChangeText={setBuildingName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="navigate-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Landmark"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>
          
          <Text style={styles.sectionTitle}>Save address as</Text>
          
          {/* Address Type Selection */}
          <View style={styles.addressTypeContainer}>
            <TouchableOpacity
              style={[
                styles.addressTypeButton,
                addressType === "home" && styles.addressTypeSelected
              ]}
              onPress={() => setAddressType("home")}
            >
              <Ionicons
                name="home-outline"
                size={20}
                color={addressType === "home" ? "#E18336" : "#6B7280"}
              />
              <Text
                style={[
                  styles.addressTypeText,
                  addressType === "home" && styles.addressTypeTextSelected
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.addressTypeButton,
                addressType === "office" && styles.addressTypeSelected
              ]}
              onPress={() => setAddressType("office")}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={addressType === "office" ? "#E18336" : "#6B7280"}
              />
              <Text
                style={[
                  styles.addressTypeText,
                  addressType === "office" && styles.addressTypeTextSelected
                ]}
              >
                Office
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.addressTypeButton,
                addressType === "other" && styles.addressTypeSelected
              ]}
              onPress={() => setAddressType("other")}
            >
              <Ionicons
                name="ellipsis-horizontal-outline"
                size={20}
                color={addressType === "other" ? "#E18336" : "#6B7280"}
              />
              <Text
                style={[
                  styles.addressTypeText,
                  addressType === "other" && styles.addressTypeTextSelected
                ]}
              >
                Others
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Receiver's name"
              value={receiverName}
              onChangeText={setReceiverName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Receiver's phone number"
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="paw-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pet's name"
              value={petName}
              onChangeText={setPetName}
            />
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
        
        <View style={styles.footer}>
            <BottomButton title="Save address" onPress={handleSaveAddress} />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0, 
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: sheetHeight,
        maxHeight: sheetHeight,
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
      },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#1F2937",
  },
  addressTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  addressTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    width: "30%",
  },
  addressTypeSelected: {
    borderColor: "#E18336",
    backgroundColor: "rgba(225, 131, 54, 0.05)",
  },
  addressTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  addressTypeTextSelected: {
    color: "#E18336",
    fontWeight: "500",
  },
  spacer: {
    height: 80,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#E18336",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
});

export default BottomSheet;