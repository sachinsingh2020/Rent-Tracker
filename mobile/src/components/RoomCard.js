import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function RoomCard({ room, onPress, onAddBill }) {
  const activeTenant = room.activeTenant;
  const isOccupied = room.status === 'Occupied' && activeTenant;

  const handleCall = () => {
    if (activeTenant?.phone) {
      Linking.openURL(`tel:${activeTenant.phone}`);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <View style={styles.roomBadge}>
            <Text style={styles.roomNumberText}>{room.roomNumber}</Text>
          </View>
          <Text style={styles.floorText}>{room.floor || 'Ground Floor'}</Text>
        </View>

        <View style={[styles.statusBadge, isOccupied ? styles.occupiedBadge : styles.availableBadge]}>
          <View style={[styles.statusDot, isOccupied ? styles.occupiedDot : styles.availableDot]} />
          <Text style={[styles.statusText, isOccupied ? styles.occupiedText : styles.availableText]}>
            {isOccupied ? 'Occupied' : 'Vacant'}
          </Text>
        </View>
      </View>

      {/* Tenant Section */}
      {isOccupied ? (
        <View style={styles.tenantContainer}>
          <View style={styles.tenantNameRow}>
            <Text style={styles.tenantName} numberOfLines={1}>
              {activeTenant.name}
            </Text>
            {activeTenant.phone ? (
              <TouchableOpacity onPress={handleCall} style={styles.phoneButton}>
                <Feather name="phone" size={13} color="#2563eb" />
                <Text style={styles.phoneText}>{activeTenant.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Pricing & Reading Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={styles.detailValue}>₹{activeTenant.negotiatedRent || room.defaultRent}</Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Last Reading</Text>
              <Text style={styles.detailValue}>{activeTenant.latestReading || activeTenant.initialReading || 0} u</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.addBillBtn}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                onAddBill(room, activeTenant);
              }}
            >
              <Feather name="plus-circle" size={15} color="#ffffff" />
              <Text style={styles.addBillBtnText}>Add Month Bill / Reading</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.arrowBtn} onPress={onPress}>
              <Feather name="chevron-right" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Vacant Room */
        <View style={styles.vacantContainer}>
          <Text style={styles.vacantSubtext}>
            Default Rent: <Text style={styles.vacantRent}>₹{room.defaultRent || 6000}/mo</Text>
          </Text>
          <View style={styles.vacantActionRow}>
            <Text style={styles.tapToAddText}>Tap to add a new tenant</Text>
            <Feather name="user-plus" size={16} color="#059669" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roomNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  floorText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  occupiedBadge: {
    backgroundColor: '#ecfdf5',
  },
  availableBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  occupiedDot: {
    backgroundColor: '#10b981',
  },
  availableDot: {
    backgroundColor: '#94a3b8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  occupiedText: {
    color: '#047857',
  },
  availableText: {
    color: '#64748b',
  },
  tenantContainer: {
    gap: 10,
  },
  tenantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addBillBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBillBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  arrowBtn: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vacantContainer: {
    paddingVertical: 6,
  },
  vacantSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  vacantRent: {
    fontWeight: '700',
    color: '#0f172a',
  },
  vacantActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tapToAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
});
