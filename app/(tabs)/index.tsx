
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import WifiManager from 'react-native-wifi-reborn';
import { useRouter } from 'expo-router';

const OFFICE_LATITUDE = 37.7749; // Example: San Francisco
const OFFICE_LONGITUDE = -122.4194;
const OFFICE_WIFI_SSID = 'OfficeWifi';

const HomeScreen = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const router = useRouter();

  const handleCheckIn = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const distance = getDistance(
        { latitude, longitude },
        { latitude: OFFICE_LATITUDE, longitude: OFFICE_LONGITUDE }
      );

      if (distance > 100) { // 100 meters radius
        Alert.alert('Error', 'You are not at the office location.');
        return;
      }

      const ssid = await WifiManager.getCurrentWifiSSID();
      if (ssid !== OFFICE_WIFI_SSID) {
        Alert.alert('Error', 'You are not connected to the office Wi-Fi.');
        return;
      }

      setIsCheckedIn(true);
      Alert.alert('Success', 'You have successfully checked in.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while checking in.');
    }
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    Alert.alert('Success', 'You have successfully checked out.');
  };

  const getDistance = (from, to) => {
    const R = 6371e3; // metres
    const φ1 = from.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = to.latitude * Math.PI / 180;
    const Δφ = (to.latitude - from.latitude) * Math.PI / 180;
    const Δλ = (to.longitude - from.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Attendance Confirmation</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCheckIn} disabled={isCheckedIn}>
            <Text style={styles.buttonText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleCheckOut} disabled={!isCheckedIn}>
            <Text style={styles.buttonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Leave Application</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/leave')}>
          <Text style={styles.buttonText}>Apply for Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featureContainer}>
        <Text style={styles.featureTitle}>Performance Application</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/performance')}>
          <Text style={styles.buttonText}>View Performance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default HomeScreen;
