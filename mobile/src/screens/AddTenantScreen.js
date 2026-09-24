import React, { useState, useEffect } from 'react';
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

export default function AddTenantScreen({ route, navigation }) {
  const passedRoom = route.params?.room;
  const { triggerRefresh } = useApp();

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(passedRoom?.id || passedRoom?._id || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [negotiatedRent, setNegotiatedRent] = useState(
    passedRoom?.defaultRent ? String(passedRoom.defaultRent) : '6000'
  );
  const [securityDeposit, setSecurityDeposit] = useState('10000');
  const [meterNumber, setMeterNumber] = useState(passedRoom?.roomNumber ? `MTR-${passedRoom.roomNumber}` : '');
  const [initialReading, setInitialReading] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const list = await dataService.getRooms();
    setRooms(list || []);
    if (!selectedRoomId && list?.length > 0) {
      setSelectedRoomId(list[0].id || list[0]._id);
      setNegotiatedRent(String(list[0].defaultRent || 6000));
      setMeterNumber(`MTR-${list[0].roomNumber}`);
    }
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
    const found = rooms.find((r) => (r.id || r._id) === roomId);
    if (found) {
      setNegotiatedRent(String(found.defaultRent || 6000));
      setMeterNumber(`MTR-${found.roomNumber}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the tenant name.');
      return;
    }
    if (!selectedRoomId) {
      Alert.alert('Missing Room', 'Please select a room.');
      return;
    }

    try {
      setSubmitting(true);
      await dataService.createTenant({
        roomId: selectedRoomId,
        name: name.trim(),
        phone: phone.trim(),
        negotiatedRent: Number(negotiatedRent) || 6000,
        securityDeposit: Number(securityDeposit) || 0,
        meterNumber: meterNumber.trim(),
        initialReading: Number(initialReading) || 0,
        notes: notes.trim(),
      });

      triggerRefresh();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save tenant');
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
        <Text style={styles.heading}>Register Tenant</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Room Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ROOM ASSIGNMENT</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomChips}>
              {rooms.map((r) => {
                const isSelected = (r.id || r._id) === selectedRoomId;
                return (
                  <TouchableOpacity
                    key={String(r.id || r._id)}
                    style={[styles.roomChip, isSelected && styles.roomChipSelected]}
                    onPress={() => handleRoomSelect(r.id || r._id)}
                  >
                    <Text style={[styles.roomChipText, isSelected && styles.roomChipTextSelected]}>
                      Room {r.roomNumber}
                    </Text>
                    <Text style={[styles.roomChipSub, isSelected && styles.roomChipSubSelected]}>
                      ₹{r.defaultRent}/mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tenant Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>TENANT & NEGOTIATED RENT</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Tenant Full Name <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Negotiated Rent Input */}
            <View style={[styles.inputGroup, styles.negotiationBox]}>
              <View style={styles.negotiationHeader}>
                <Text style={styles.label}>Negotiated Monthly Rent (₹)</Text>
                <Text style={styles.negotiationTag}>Negotiable</Text>
              </View>
              <View style={styles.currencyInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  keyboardType="numeric"
                  placeholder="5500"
                  placeholderTextColor="#94a3b8"
                  value={negotiatedRent}
                  onChangeText={setNegotiatedRent}
                />
              </View>
              <Text style={styles.hint}>
                Pre-filled with room default, but you can adjust to whatever rent was agreed upon.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Security Deposit (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="10000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={securityDeposit}
                onChangeText={setSecurityDeposit}
              />
            </View>
          </View>

          {/* Electricity Meter Baseline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ELECTRICITY METER SETUP</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Initial Meter Reading <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.monoInput]}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={initialReading}
                onChangeText={setInitialReading}
              />
              <Text style={styles.hint}>Baseline reading units when this tenant moves into the room.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Physical Meter Identifier</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MTR-101"
                placeholderTextColor="#94a3b8"
                value={meterNumber}
                onChangeText={setMeterNumber}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={submitting}
          >
            <Feather name="user-check" size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>{submitting ? 'Registering...' : 'Register Tenant'}</Text>
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
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  roomChips: {
    gap: 8,
  },
  roomChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  roomChipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  roomChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  roomChipTextSelected: {
    color: '#ffffff',
  },
  roomChipSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  roomChipSubSelected: {
    color: '#94a3b8',
  },
  inputGroup: {
    gap: 6,
  },
  negotiationBox: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  negotiationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  negotiationTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
  monoInput: {
    fontFamily: 'monospace',
    fontWeight: '700',
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
    backgroundColor: '#ffffff',
  },
  hint: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 4,
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
