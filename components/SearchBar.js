import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({
  value,
  onChangeText,
  onClear,
  placeholder = "Search for area, street name...",
  autoFocus = true,
  returnKeyType = "search",
  selectionColor = "#E18336",
  onSubmitEditing,
}) => {
  return (
    <View style={styles.searchInputContainer}>
      <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        selectionColor={selectionColor}
        onSubmitEditing={onSubmitEditing}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default SearchBar;