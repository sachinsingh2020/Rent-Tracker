import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';

export default function AddRoomScreen({ navigation }) {
  const { settings, triggerRefresh } = useApp();

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [defaultRent, setDefaultRent] = useState(String(settings.defaultRoomRent || 6000));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!roomNumber.trim()) {
      Alert.alert('Required Field', 'Please enter a room number.');
      return;
    }

    try {
      setSubmitting(true);
      await dataService.createRoom({
        roomNumber: roomNumber.trim(),
        floor: floor.trim(),
        defaultRent: Number(defaultRent) || 6000,
        notes: notes.trim(),
      });

      triggerRefresh();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.heading}>Add New Room</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card */}
          <View style={styles.card}>
            {/* Room Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Room Number / Name <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 101 or Room A"
                placeholderTextColor="#94a3b8"
                value={roomNumber}
                onChangeText={setRoomNumber}
                autoFocus
              />
            </View>

            {/* Floor */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Floor Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ground Floor, 1st Floor"
                placeholderTextColor="#94a3b8"
                value={floor}
                onChangeText={setFloor}
              />
            </View>

            {/* Default Rent */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Default Room Rent (₹/month) <Text style={styles.req}>*</Text>
              </Text>
              <View style={styles.currencyInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  keyboardType="numeric"
                  placeholder="6000"
                  placeholderTextColor="#94a3b8"
                  value={defaultRent}
                  onChangeText={setDefaultRent}
                />
              </View>
              <Text style={styles.hint}>
                You can customize/negotiate this rent whenever a new tenant moves into this room.
              </Text>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remarks / Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Attached washroom, corner balcony..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={submitting}
          >
            <Feather name="check-circle" size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>{submitting ? 'Creating Room...' : 'Create Room'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: 6,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  req: {
    color: '#e11d48',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  currencyInput: {
    flex: 1,
    paddingLeft: 30,
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
