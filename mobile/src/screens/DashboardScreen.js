import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import StatBanner from '../components/StatBanner';
import RoomCard from '../components/RoomCard';

export default function DashboardScreen({ navigation }) {
  const { storageMode, refreshTrigger } = useApp();
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({ rent: 0, elec: 0, occupied: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const roomsData = await dataService.getRooms();
      setRooms(roomsData || []);

      // Calculate totals
      let rentDues = 0;
      let elecDues = 0;
      let occupiedCount = 0;

      const tenantsData = await dataService.getTenants();
      (tenantsData || []).forEach((t) => {
        if (t.status === 'Active') {
          occupiedCount += 1;
          rentDues += Number(t.pendingRent) || 0;
          elecDues += Number(t.pendingElectricity) || 0;
        }
      });

      setTotals({ rent: rentDues, elec: elecDues, occupied: occupiedCount });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger, storageMode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchRoom = r.roomNumber?.toLowerCase().includes(q);
    const matchTenant = r.activeTenant?.name?.toLowerCase().includes(q);
    return matchRoom || matchTenant;
  });

  const handleRoomPress = (room) => {
    if (room.status === 'Occupied' && room.activeTenant) {
      navigation.navigate('RoomDetail', { room, tenantId: room.activeTenant.id || room.activeTenant._id });
    } else {
      navigation.navigate('AddTenant', { room });
    }
  };

  const handleAddBill = (room, tenant) => {
    navigation.navigate('AddBill', { room, tenant });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appName}>RentTracker</Text>
          <Text style={styles.appSub}>Room Rent & Electricity Manager</Text>
        </View>

        <TouchableOpacity
          style={styles.addRoomBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddRoom')}
        >
          <Feather name="plus" size={16} color="#ffffff" />
          <Text style={styles.addRoomBtnText}>Add Room</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => String(item.id || item._id)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />}
        ListHeaderComponent={
          <>
            {/* Financial Overview Banner */}
            <StatBanner
              totalRentDues={totals.rent}
              totalElecDues={totals.elec}
              activeRooms={totals.occupied}
              totalRooms={rooms.length}
              storageMode={storageMode}
            />

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search room number or tenant..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionHeading}>
                ALL ROOMS ({filteredRooms.length})
              </Text>
              <Text style={styles.sectionSub}>Tap for full history</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onPress={() => handleRoomPress(item)}
            onAddBill={handleAddBill}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Feather name="home" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching rooms found' : 'No rooms added yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Try searching with another room number or name.'
                  : 'Start by creating your first room with default rent.'}
              </Text>
              {!searchQuery ? (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('AddRoom')}
                >
                  <Text style={styles.emptyActionText}>Create Room 101</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  addRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addRoomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
