
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PerformanceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance</Text>
      <Text style={styles.placeholder}>Performance metrics will be displayed here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
  },
});

export default PerformanceScreen;
