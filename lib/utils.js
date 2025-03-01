import { router } from "expo-router";

export const handleChangeAddress = () => {
    router.push("/address/search");
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };


  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance between two points on Earth
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    
    // Format the distance in a user-friendly way
    if (d < 1) {
      return `${Math.round(d * 1000)}m`;
    } else {
      return `${d.toFixed(1)}km`;
    }
  };