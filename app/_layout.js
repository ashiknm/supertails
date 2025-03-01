import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Custom header back button
function CustomBackButton() {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      style={styles.backButton}
      onPress={() => router.back()}
    >
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 20,
            color: '#000',
          },
          headerTitleAlign: 'left',
          headerShadowVisible: false,
          headerLeft: () => <CustomBackButton />,
          // Adjust top inset/padding to match design
          headerStatusBarHeight: 40,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "Address Selection",
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="address/search" 
          options={{ 
            title: "Add Address",
            headerShown: false, 
          }} 
        />
        <Stack.Screen 
          name="address/map" 
          options={{ 
            title: "Confirm Location",
            headerShown: true
          }} 
        />
      </Stack>
    </Provider>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: 8,
  }
});