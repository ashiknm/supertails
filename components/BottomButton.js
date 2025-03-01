import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const BottomButton = ({
  title = "Add address",
  onPress,
}) => {
  return (
      <TouchableOpacity 
        style={styles.addAddressButton}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
      addAddressButton: {
        backgroundColor: "#E18336",
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

export default BottomButton;