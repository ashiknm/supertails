import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AddressDisplay = ({
  selectedAddress,
  onChangePress,
  containerStyle,
  iconColor = "#75A800",
  showChangeButton = true,
}) => {
  return (
    <View style={[styles.addressContainer, containerStyle]}>
      <Ionicons name="location" size={24} color={iconColor} style={styles.addressIcon} />
      <View style={styles.addressTextContainer}>
        <Text style={styles.addressName}>
          {selectedAddress?.formattedAddress || "Selected Address"}
        </Text>
        {selectedAddress?.fullAddress && (
          <Text style={styles.addressFull}>
            {selectedAddress.fullAddress}
          </Text>
        )}
      </View>
      {showChangeButton && (
        <TouchableOpacity style={styles.changeButton} onPress={onChangePress}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    addressContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 24,
      },
      addressIcon: {
        marginTop: 3,
        marginRight: 12,
      },
      addressTextContainer: {
        flex: 1,
      },
      addressName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 4,
      },
      addressFull: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
      },
      changeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      changeButtonText: {
        color: "#E18336",
        fontSize: 14,
        fontWeight: "500",
      },
});

export default AddressDisplay;