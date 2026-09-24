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
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';

export default function AddBillScreen({ route, navigation }) {
  const { room, tenant } = route.params;
  const { settings, triggerRefresh } = useApp();

  const prevReading = Number(tenant?.latestReading) || Number(tenant?.initialReading) || 0;
  const initialRent = Number(tenant?.negotiatedRent) || Number(room?.defaultRent) || 6000;
  const defaultRate = Number(settings.defaultElectricityRate) || 11;

  const [monthYear, setMonthYear] = useState(
    new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );
  const [roomRentAmount, setRoomRentAmount] = useState(String(initialRent));
  const [roomRentStatus, setRoomRentStatus] = useState('Pending');

  const [currentReading, setCurrentReading] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState(String(defaultRate));
  const [electricityStatus, setElectricityStatus] = useState('Pending');

  const [photoUri, setPhotoUri] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live Calculations
  const currVal = parseFloat(currentReading);
  const rateVal = parseFloat(ratePerUnit) || 0;
  const rentVal = parseFloat(roomRentAmount) || 0;

  const isValidReading = !isNaN(currVal) && currVal >= prevReading;
  const unitsConsumed = isValidReading ? Math.round((currVal - prevReading) * 100) / 100 : 0;
  const electricityAmount = isValidReading ? Math.round(unitsConsumed * rateVal * 100) / 100 : 0;
  const grandTotal = Math.round((rentVal + electricityAmount) * 100) / 100;

  const handlePickPhoto = async () => {
    Alert.alert('Attach Meter Proof', 'Choose image source:', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Photo Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (isNaN(currVal)) {
      Alert.alert('Invalid Reading', 'Please enter a valid current meter reading.');
      return;
    }
    if (currVal < prevReading) {
      Alert.alert(
        'Reading Error',
        `Current reading (${currVal}) cannot be less than previous reading (${prevReading}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      await dataService.createBill({
        tenantId: tenant.id || tenant._id,
        roomId: room.id || room._id,
        monthYear,
        roomRentAmount: rentVal,
        roomRentStatus,
        previousReading: prevReading,
        currentReading: currVal,
        ratePerUnit: rateVal,
        electricityStatus,
        meterPhotoUrl: photoUri,
        notes,
      });

      triggerRefresh();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save bill record');
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
        <View style={styles.topBarTitle}>
          <Text style={styles.heading}>New Monthly Bill</Text>
          <Text style={styles.subHeading}>
            Room {room.roomNumber} • {tenant.name}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Billing Cycle / Month */}
          <View style={styles.monthBox}>
            <Feather name="calendar" size={15} color="#475569" />
            <Text style={styles.monthLabel}>Billing Month:</Text>
            <TextInput
              style={styles.monthInput}
              value={monthYear}
              onChangeText={setMonthYear}
              placeholder="e.g. September 2026"
            />
          </View>

          {/* 🏠 Card 1: Room Rent */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleRent}>
                <Feather name="home" size={15} color="#ea580c" />
              </View>
              <Text style={styles.cardTitle}>1. ROOM RENT</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rent Amount (₹)</Text>
              <View style={styles.currencyInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  keyboardType="numeric"
                  value={roomRentAmount}
                  onChangeText={setRoomRentAmount}
                />
              </View>
            </View>

            <View style={styles.statusToggleRow}>
              <Text style={styles.statusToggleLabel}>Payment Status:</Text>
              <View style={styles.toggleButtonGroup}>
                <TouchableOpacity
                  style={[styles.togglePill, roomRentStatus === 'Pending' && styles.togglePillPending]}
                  onPress={() => setRoomRentStatus('Pending')}
                >
                  <Text
                    style={[styles.togglePillText, roomRentStatus === 'Pending' && styles.togglePillTextPending]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.togglePill, roomRentStatus === 'Paid' && styles.togglePillPaid]}
                  onPress={() => setRoomRentStatus('Paid')}
                >
                  <Text style={[styles.togglePillText, roomRentStatus === 'Paid' && styles.togglePillTextPaid]}>
                    Paid ✅
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ⚡ Card 2: Electricity Readings */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleElec}>
                <Feather name="zap" size={15} color="#eab308" />
              </View>
              <Text style={styles.cardTitle}>2. ELECTRICITY READING</Text>
            </View>

            {/* Readings Grid */}
            <View style={styles.readingsRow}>
              <View style={styles.readingBox}>
                <Text style={styles.readingLabel}>PREVIOUS</Text>
                <View style={styles.readingStaticBox}>
                  <Text style={styles.readingStaticText}>{prevReading} u</Text>
                </View>
              </View>

              <View style={styles.readingBox}>
                <Text style={styles.readingLabel}>
                  CURRENT <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.readingInput]}
                  placeholder="e.g. 1320"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={currentReading}
                  onChangeText={setCurrentReading}
                  autoFocus
                />
              </View>
            </View>

            {/* Dynamic Rate & Live Math Preview */}
            <View style={styles.mathPreviewBox}>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Rate per Unit (₹):</Text>
                <TextInput
                  style={styles.rateInput}
                  keyboardType="numeric"
                  value={ratePerUnit}
                  onChangeText={setRatePerUnit}
                />
              </View>

              <View style={styles.calcDivider} />

              <View style={styles.calcResultRow}>
                <View>
                  <Text style={styles.calcSubLabel}>Consumed Units</Text>
                  <Text style={styles.calcUnitsVal}>{unitsConsumed} units</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.calcSubLabel}>Electricity Bill</Text>
                  <Text style={styles.calcElecVal}>₹{electricityAmount}</Text>
                </View>
              </View>
            </View>

            {/* Electricity Payment Status */}
            <View style={styles.statusToggleRow}>
              <Text style={styles.statusToggleLabel}>Payment Status:</Text>
              <View style={styles.toggleButtonGroup}>
                <TouchableOpacity
                  style={[styles.togglePill, electricityStatus === 'Pending' && styles.togglePillPending]}
                  onPress={() => setElectricityStatus('Pending')}
                >
                  <Text
                    style={[
                      styles.togglePillText,
                      electricityStatus === 'Pending' && styles.togglePillTextPending,
                    ]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.togglePill, electricityStatus === 'Paid' && styles.togglePillPaid]}
                  onPress={() => setElectricityStatus('Paid')}
                >
                  <Text
                    style={[styles.togglePillText, electricityStatus === 'Paid' && styles.togglePillTextPaid]}
                  >
                    Paid ✅
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 📸 Card 3: Meter Photo Proof */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. METER PHOTO PROOF (OPTIONAL)</Text>

            {photoUri ? (
              <View style={styles.photoPreviewBox}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri('')}>
                  <Feather name="trash-2" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.8} onPress={handlePickPhoto}>
                <View style={styles.cameraIconCircle}>
                  <Feather name="camera" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.uploadBtnTitle}>Tap to snap or upload meter photo</Text>
                <Text style={styles.uploadBtnSub}>
                  Optional: If skipped, "Photo not uploaded by owner" is shown.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 💰 Grand Combined Total Banner */}
          <View style={styles.grandTotalBanner}>
            <View>
              <Text style={styles.grandTotalSub}>TOTAL MONTHLY AMOUNT</Text>
              <Text style={styles.grandTotalBreakdown}>
                Rent (₹{rentVal}) + Elec (₹{electricityAmount})
              </Text>
            </View>
            <Text style={styles.grandTotalAmount}>₹{grandTotal}</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, (!isValidReading || submitting) && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={!isValidReading || submitting}
          >
            <Feather name="check" size={20} color="#ffffff" />
            <Text style={styles.saveBtnText}>
              {submitting ? 'Saving...' : `Save Monthly Bill (₹${grandTotal})`}
            </Text>
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
  topBarTitle: {
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subHeading: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 34,
  },
  monthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  monthInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleRent: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleElec: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#fefce8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
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
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  statusToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleButtonGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  togglePillPending: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  togglePillPaid: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  togglePillTextPending: {
    color: '#b45309',
  },
  togglePillTextPaid: {
    color: '#047857',
  },
  readingsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readingBox: {
    flex: 1,
    gap: 4,
  },
  readingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  readingStaticBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  readingStaticText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    fontFamily: 'monospace',
  },
  readingInput: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  mathPreviewBox: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 8,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
  },
  rateInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
    width: 60,
    textAlign: 'center',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#fef3c7',
  },
  calcResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcSubLabel: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600',
  },
  calcUnitsVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    fontFamily: 'monospace',
  },
  calcElecVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#b45309',
  },
  uploadBtn: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  cameraIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  uploadBtnSub: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  photoPreviewBox: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 14,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.85)',
    padding: 8,
    borderRadius: 20,
  },
  grandTotalBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  grandTotalBreakdown: {
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 2,
  },
  grandTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#34d399',
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
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
