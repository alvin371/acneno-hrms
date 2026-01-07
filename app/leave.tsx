
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const LeaveApplicationScreen = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    // Basic validation
    if (!leaveType || !startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    // In a real app, you'd submit this to a backend.
    Alert.alert('Success', 'Your leave application has been submitted.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leave Application</Text>
      <TextInput
        style={styles.input}
        placeholder="Leave Type (e.g., Vacation, Sick Leave)"
        value={leaveType}
        onChangeText={setLeaveType}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      <TextInput
        style={[styles.input, styles.reasonInput]}
        placeholder="Reason"
        value={reason}
        onChangeText={setReason}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Application</Text>
      </TouchableOpacity>
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
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reasonInput: {
    height: 100,
    textAlignVertical: 'top', // To make placeholder visible on Android
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LeaveApplicationScreen;
