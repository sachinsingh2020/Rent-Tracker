import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { dataService } from '../services/dataService';
import { useApp } from '../context/AppContext';
import BillCard from '../components/BillCard';
import CompactBillTable from '../components/CompactBillTable';

export default function RoomDetailScreen({ route, navigation }) {
  const { room, tenantId } = route.params;
  const { refreshTrigger, triggerRefresh } = useApp();

  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dataService.getTenantById(tenantId);
      if (data) {
        setTenant(data.tenant);
        setBills(data.bills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleToggleRent = async (bill) => {
    const next = bill.roomRentStatus === 'Paid' ? 'Pending' : 'Paid';
    await dataService.updatePaymentStatus(bill.id || bill._id, { roomRentStatus: next });
    triggerRefresh();
  };

  const handleToggleElectricity = async (bill) => {
    const next = bill.electricityStatus === 'Paid' ? 'Pending' : 'Paid';
    await dataService.updatePaymentStatus(bill.id || bill._id, { electricityStatus: next });
    triggerRefresh();
  };

  const executeVacate = async () => {
    try {
      await dataService.vacateTenant(tenantId);
      triggerRefresh();
      navigation.goBack();
    } catch (err) {
      console.error('Failed to vacate:', err);
    }
  };

  const handleVacate = () => {
    const confirmMsg = `Are you sure you want to mark ${tenant?.name || 'this tenant'} as vacated? This will free Room ${room.roomNumber} for new tenants.`;
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        executeVacate();
      }
      return;
    }

    Alert.alert(
      'Vacate Room',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vacate Room',
          style: 'destructive',
          onPress: executeVacate,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.topBarTitle}>
          <Text style={styles.roomHeading}>Room {room.roomNumber}</Text>
          <Text style={styles.tenantSub}>{tenant?.name || 'Tenant Details'}</Text>
        </View>

        <TouchableOpacity
          style={styles.addBillHeaderBtn}
          onPress={() => navigation.navigate('AddBill', { room, tenant })}
        >
          <Feather name="plus" size={16} color="#ffffff" />
          <Text style={styles.addBillHeaderText}>Add Bill</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => String(item.id || item._id)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Tenant Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View>
                  <Text style={styles.profileName}>{tenant?.name}</Text>
                  {tenant?.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${tenant.phone}`)}
                      style={styles.phoneTag}
                    >
                      <Feather name="phone" size={12} color="#2563eb" />
                      <Text style={styles.phoneTagText}>{tenant.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity style={styles.vacateBtn} onPress={handleVacate}>
                  <Text style={styles.vacateBtnText}>Vacate</Text>
                </TouchableOpacity>
              </View>

              {/* Financial Snapshot Grid */}
              <View style={styles.snapshotGrid}>
                <View style={styles.snapshotBox}>
                  <Text style={styles.snapshotLabel}>Negotiated Rent</Text>
                  <Text style={styles.snapshotVal}>₹{tenant?.negotiatedRent || room.defaultRent}</Text>
                </View>

                <View style={styles.snapshotBox}>
                  <Text style={styles.snapshotLabel}>Last Meter</Text>
                  <Text style={styles.snapshotVal}>{tenant?.latestReading || tenant?.initialReading || 0} u</Text>
                </View>

                <View style={[styles.snapshotBox, (tenant?.totalPendingDue || 0) > 0 ? styles.duesBoxAlert : styles.duesBoxClean]}>
                  <Text style={styles.snapshotLabel}>Total Due</Text>
                  <Text style={[styles.snapshotVal, (tenant?.totalPendingDue || 0) > 0 ? styles.dueTextAlert : styles.dueTextClean]}>
                    ₹{tenant?.totalPendingDue || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>MONTHLY BILLING HISTORY ({bills.length})</Text>
                <Text style={styles.sectionSubtitle}>Newest First</Text>
              </View>

              {/* View Mode Toggle: Cards vs Shrink Table */}
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'cards' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('cards')}
                >
                  <Feather
                    name="grid"
                    size={14}
                    color={viewMode === 'cards' ? '#2563eb' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === 'cards' && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Cards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'table' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('table')}
                >
                  <Feather
                    name="list"
                    size={14}
                    color={viewMode === 'table' ? '#2563eb' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.viewModeBtnText,
                      viewMode === 'table' && styles.viewModeBtnTextActive,
                    ]}
                  >
                    Shrink Table
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* If in table mode, render CompactBillTable inside header */}
            {viewMode === 'table' && bills.length > 0 && (
              <CompactBillTable
                bills={bills}
                tenant={tenant}
                room={room}
                onToggleRent={handleToggleRent}
                onToggleElectricity={handleToggleElectricity}
                onPhotoPress={(url) => setSelectedPhoto(url)}
              />
            )}
          </>
        }
        data={viewMode === 'cards' ? bills : []}
        renderItem={({ item }) => (
          <BillCard
            bill={item}
            tenant={tenant}
            room={room}
            onToggleRent={handleToggleRent}
            onToggleElectricity={handleToggleElectricity}
            onPhotoPress={(url) => setSelectedPhoto(url)}
          />
        )}
        ListEmptyComponent={
          !loading && bills.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="file-text" size={32} color="#cbd5e1" />
              <Text style={styles.emptyHeading}>No monthly bills logged yet</Text>
              <Text style={styles.emptyDesc}>
                Move-in meter reading was {tenant?.initialReading || 0} units. Tap "Add Bill" to create the first entry.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      <Modal visible={Boolean(selectedPhoto)} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
            <Feather name="x" size={24} color="#ffffff" />
          </TouchableOpacity>
          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
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
    paddingVertical: 10,
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
  roomHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  tenantSub: {
    fontSize: 11,
    color: '#64748b',
  },
  addBillHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBillHeaderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phoneTagText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  vacateBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  vacateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  snapshotBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  snapshotVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  duesBoxAlert: {
    backgroundColor: '#fff1f2',
  },
  duesBoxClean: {
    backgroundColor: '#f0fdf4',
  },
  dueTextAlert: {
    color: '#e11d48',
  },
  dueTextClean: {
    color: '#16a34a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeBtnTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 260,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: '90%',
    height: '75%',
    borderRadius: 16,
  },
});
