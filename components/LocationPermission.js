import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const LocationPermission = ({
  title = "Enable location permission",
  subtitle = "Your precise location helps us deliver on time",
  onEnable,
  iconName = "location-outline",
  buttonText = "Enable",
  style
}) => {
  return (
    <View style={[styles.locationPermissionContainer, style]}>
      <View style={styles.locationInfoContainer}>
        <Ionicons name={iconName} size={22} color="#000" />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationTitle}>{title}</Text>
          <Text style={styles.locationSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.enableButton}
        onPress={onEnable}
      >
        <Text style={styles.enableButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  locationPermissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF6F7',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    borderTopColor: "#000000",
    borderTopWidth: 0.1,
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '350',
    color: '#1B281B',
  },
  locationSubtitle: {
    fontSize: 10,
    color: '#142E159E',
    marginTop: 4,
    fontWeight: '400',
  },
  enableButton: {
    backgroundColor: '#EF6C00',
    borderRadius: 8,
    height: 28,
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonText: {
    color: 'white',
    fontWeight: '350',
    fontSize: 12,
  },
});

export default LocationPermission;