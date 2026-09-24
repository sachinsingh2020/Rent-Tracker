import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function BillCard({ bill, tenant, room, onToggleRent, onToggleElectricity, onPhotoPress }) {
  const isRentPaid = bill.roomRentStatus === 'Paid';
  const isElecPaid = bill.electricityStatus === 'Paid';
  const isFullyPaid = isRentPaid && isElecPaid;

  const handleWhatsAppShare = () => {
    const phone = tenant?.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const text = `⚡ *Rent & Electricity Bill - Room ${room?.roomNumber || ''}*
Tenant: *${tenant?.name || ''}*
Billing Month: *${bill.monthYear}*
---------------------------------
🏠 *Room Rent:* ₹${bill.roomRentAmount} (${bill.roomRentStatus})
---------------------------------
⚡ *Electricity Details:*
• Prev Reading: ${bill.previousReading} units
• Current Reading: ${bill.currentReading} units
• Units Consumed: *${bill.unitsConsumed} units*
• Rate per Unit: ₹${bill.ratePerUnit}/unit
• Electricity Bill: ₹${bill.electricityAmount} (${bill.electricityStatus})
---------------------------------
💰 *Total Amount: ₹${bill.totalDue}*
Status: *${isFullyPaid ? 'FULLY PAID ✅' : 'PENDING ⚠️'}*
${bill.meterPhotoUrl ? `\n📸 Meter Proof: ${bill.meterPhotoUrl}` : ''}
${bill.notes ? `\nNote: ${bill.notes}` : ''}

Please settle the dues at your earliest convenience. Thank you!`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      {/* Month & Fully Paid Badge */}
      <View style={styles.header}>
        <View style={styles.monthBadge}>
          <Feather name="calendar" size={13} color="#475569" />
          <Text style={styles.monthText}>{bill.monthYear}</Text>
        </View>

        <View style={[styles.statusPill, isFullyPaid ? styles.paidPill : styles.pendingPill]}>
          <Feather
            name={isFullyPaid ? 'check-circle' : 'alert-circle'}
            size={12}
            color={isFullyPaid ? '#047857' : '#b45309'}
          />
          <Text style={[styles.statusPillText, isFullyPaid ? styles.paidText : styles.pendingText]}>
            {isFullyPaid ? 'All Cleared' : 'Payment Due'}
          </Text>
        </View>
      </View>

      {/* 🏠 Section 1: Room Rent */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionLeft}>
          <View style={styles.rentIcon}>
            <Feather name="home" size={14} color="#ea580c" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Room Rent</Text>
            <Text style={styles.amountText}>₹{bill.roomRentAmount}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.toggleBtn, isRentPaid ? styles.btnPaid : styles.btnPending]}
          onPress={() => onToggleRent(bill)}
        >
          <Feather name={isRentPaid ? 'check' : 'clock'} size={12} color={isRentPaid ? '#047857' : '#b45309'} />
          <Text style={[styles.toggleBtnText, isRentPaid ? styles.btnPaidText : styles.btnPendingText]}>
            {isRentPaid ? 'Paid' : 'Due'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⚡ Section 2: Electricity */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionLeft}>
          <View style={styles.elecIcon}>
            <Feather name="zap" size={14} color="#eab308" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Electricity ({bill.unitsConsumed} units @ ₹{bill.ratePerUnit})</Text>
            <Text style={styles.amountText}>₹{bill.electricityAmount}</Text>
            <Text style={styles.readingSubtext}>
              {bill.previousReading} u → {bill.currentReading} u
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.toggleBtn, isElecPaid ? styles.btnPaid : styles.btnPending]}
          onPress={() => onToggleElectricity(bill)}
        >
          <Feather name={isElecPaid ? 'check' : 'clock'} size={12} color={isElecPaid ? '#047857' : '#b45309'} />
          <Text style={[styles.toggleBtnText, isElecPaid ? styles.btnPaidText : styles.btnPendingText]}>
            {isElecPaid ? 'Paid' : 'Due'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meter Photo Thumbnail if present */}
      {bill.meterPhotoUrl ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.photoContainer}
          onPress={() => onPhotoPress(bill.meterPhotoUrl)}
        >
          <Image source={{ uri: bill.meterPhotoUrl }} style={styles.thumbnail} />
          <View style={styles.photoInfo}>
            <Text style={styles.photoLabel}>Meter Proof Attached</Text>
            <Text style={styles.photoSub}>Tap to view full photo</Text>
          </View>
          <Feather name="maximize-2" size={16} color="#64748b" />
        </TouchableOpacity>
      ) : (
        <View style={styles.noPhotoBox}>
          <Feather name="camera-off" size={12} color="#94a3b8" />
          <Text style={styles.noPhotoText}>Photo not uploaded by owner</Text>
        </View>
      )}

      {/* Card Footer: Total Due & WhatsApp Share */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotalLabel}>Total Monthly Due</Text>
          <Text style={styles.footerTotalValue}>₹{bill.totalDue}</Text>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppShare}>
          <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
          <Text style={styles.whatsappBtnText}>Send Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  paidPill: {
    backgroundColor: '#ecfdf5',
  },
  pendingPill: {
    backgroundColor: '#fffbeb',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paidText: {
    color: '#047857',
  },
  pendingText: {
    color: '#b45309',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  elecIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fefce8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  readingSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnPaid: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  btnPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnPaidText: {
    color: '#047857',
  },
  btnPendingText: {
    color: '#b45309',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  photoInfo: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  photoSub: {
    fontSize: 10,
    color: '#64748b',
  },
  noPhotoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  noPhotoText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerTotalLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
