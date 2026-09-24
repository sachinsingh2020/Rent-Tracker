import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function CompactBillTable({
  bills = [],
  tenant,
  room,
  onToggleRent,
  onToggleElectricity,
  onPhotoPress,
}) {
  const handleWhatsApp = (bill) => {
    const phone = tenant?.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const text = `⚡ *Bill for ${bill.monthYear} (Room ${room?.roomNumber || ''})*
Tenant: ${tenant?.name || ''}
Rent: ₹${bill.roomRentAmount} (${bill.roomRentStatus})
Electricity: ${bill.unitsConsumed} units @ ₹${bill.ratePerUnit} = ₹${bill.electricityAmount} (${bill.electricityStatus})
Total Amount: ₹${bill.totalDue}
Status: ${bill.isFullyPaid ? 'FULLY PAID ✅' : 'PENDING ⚠️'}`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.tableCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Table Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { width: 110 }]}>MONTH</Text>
            <Text style={[styles.headerCell, { width: 90 }]}>ROOM RENT</Text>
            <Text style={[styles.headerCell, { width: 130 }]}>ELECTRICITY</Text>
            <Text style={[styles.headerCell, { width: 85 }]}>TOTAL DUE</Text>
            <Text style={[styles.headerCell, { width: 75 }]}>STATUS</Text>
            <Text style={[styles.headerCell, { width: 65, textAlign: 'center' }]}>PROOF</Text>
            <Text style={[styles.headerCell, { width: 55, textAlign: 'center' }]}>SHARE</Text>
          </View>

          {/* Table Rows */}
          {bills.map((bill, index) => {
            const isRentPaid = bill.roomRentStatus === 'Paid';
            const isElecPaid = bill.electricityStatus === 'Paid';
            const isFullyPaid = isRentPaid && isElecPaid;

            return (
              <View
                key={String(bill.id || bill._id || index)}
                style={[styles.row, index % 2 === 1 && styles.rowAlt]}
              >
                {/* Month */}
                <View style={[styles.cell, { width: 110 }]}>
                  <Text style={styles.monthText} numberOfLines={1}>
                    {bill.monthYear}
                  </Text>
                  <Text style={styles.subDate}>
                    {bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                  </Text>
                </View>

                {/* Room Rent */}
                <View style={[styles.cell, { width: 90 }]}>
                  <Text style={styles.amountBold}>₹{bill.roomRentAmount}</Text>
                  <TouchableOpacity
                    style={[styles.statusMiniPill, isRentPaid ? styles.paidMini : styles.pendingMini]}
                    onPress={() => onToggleRent(bill)}
                  >
                    <Text style={[styles.statusMiniText, isRentPaid ? styles.paidMiniText : styles.pendingMiniText]}>
                      {isRentPaid ? 'Rent Paid' : 'Rent Due'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Electricity */}
                <View style={[styles.cell, { width: 130 }]}>
                  <Text style={styles.amountBold}>
                    ₹{bill.electricityAmount}
                    <Text style={styles.unitSub}> ({bill.unitsConsumed}u)</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.statusMiniPill, isElecPaid ? styles.paidMini : styles.pendingMini]}
                    onPress={() => onToggleElectricity(bill)}
                  >
                    <Text style={[styles.statusMiniText, isElecPaid ? styles.paidMiniText : styles.pendingMiniText]}>
                      {isElecPaid ? 'Elec Paid' : 'Elec Due'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Total */}
                <View style={[styles.cell, { width: 85 }]}>
                  <Text style={styles.totalAmount}>₹{bill.totalDue}</Text>
                </View>

                {/* Status */}
                <View style={[styles.cell, { width: 75 }]}>
                  <View style={[styles.overallBadge, isFullyPaid ? styles.overallPaid : styles.overallPending]}>
                    <Text style={[styles.overallText, isFullyPaid ? styles.paidMiniText : styles.pendingMiniText]}>
                      {isFullyPaid ? 'CLEARED' : 'PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Photo Proof */}
                <View style={[styles.cell, { width: 65, alignItems: 'center' }]}>
                  {bill.meterPhotoUrl ? (
                    <TouchableOpacity
                      style={styles.photoBtn}
                      onPress={() => onPhotoPress(bill.meterPhotoUrl)}
                    >
                      <Feather name="image" size={14} color="#f59e0b" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.dashText}>—</Text>
                  )}
                </View>

                {/* Share WhatsApp */}
                <View style={[styles.cell, { width: 55, alignItems: 'center' }]}>
                  <TouchableOpacity style={styles.shareBtn} onPress={() => handleWhatsApp(bill)}>
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: '#f8fafc',
  },
  cell: {
    justifyContent: 'center',
    paddingRight: 6,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  subDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  amountBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  unitSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  statusMiniPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  paidMini: {
    backgroundColor: '#ecfdf5',
  },
  pendingMini: {
    backgroundColor: '#fffbeb',
  },
  statusMiniText: {
    fontSize: 9,
    fontWeight: '700',
  },
  paidMiniText: {
    color: '#047857',
  },
  pendingMiniText: {
    color: '#b45309',
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  overallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  overallPaid: {
    backgroundColor: '#ecfdf5',
  },
  overallPending: {
    backgroundColor: '#fffbeb',
  },
  overallText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  photoBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  shareBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dashText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
});
