import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatBanner({ totalRentDues = 0, totalElecDues = 0, activeRooms = 0, totalRooms = 0, storageMode = 'offline' }) {
  const totalCombined = totalRentDues + totalElecDues;

  return (
    <View style={styles.card}>
      {/* Top row: Mode badge & Heading */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.subTitle}>TOTAL UNCOLLECTED DUES</Text>
          <Text style={styles.bigAmount}>₹{totalCombined.toLocaleString('en-IN')}</Text>
        </View>

        <View style={[styles.modeBadge, storageMode === 'cloud' ? styles.cloudBadge : styles.offlineBadge]}>
          <Feather
            name={storageMode === 'cloud' ? 'cloud' : 'smartphone'}
            size={12}
            color={storageMode === 'cloud' ? '#0284c7' : '#059669'}
          />
          <Text style={[styles.modeText, storageMode === 'cloud' ? styles.cloudText : styles.offlineText]}>
            {storageMode === 'cloud' ? 'Cloud Synced' : 'Offline Local'}
          </Text>
        </View>
      </View>

      {/* Breakdown row: Rent vs Electricity */}
      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.iconCircleRent}>
            <Feather name="home" size={14} color="#ea580c" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Room Rent</Text>
            <Text style={styles.metricValue}>₹{totalRentDues.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.metricItem}>
          <View style={styles.iconCircleElec}>
            <Feather name="zap" size={14} color="#eab308" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Electricity</Text>
            <Text style={styles.metricValue}>₹{totalElecDues.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.metricItem}>
          <View style={styles.iconCircleRooms}>
            <MaterialCommunityIcons name="door" size={16} color="#6366f1" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Occupied</Text>
            <Text style={styles.metricValue}>{activeRooms}/{totalRooms}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bigAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  offlineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cloudBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offlineText: {
    color: '#34d399',
  },
  cloudText: {
    color: '#38bdf8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  iconCircleRent: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 88, 12, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleElec: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRooms: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '700',
  },
});
