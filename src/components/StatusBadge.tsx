import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, Clock, CalendarCheck } from 'lucide-react-native';
import { TaskStatus } from '@/types/models';
import { Palette } from '@/constants/Colors';

interface StatusBadgeProps {
  status: TaskStatus;
  daysRemaining: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, daysRemaining }) => {
  if (status === 'overdue') {
    const absDays = Math.abs(daysRemaining);
    return (
      <View style={[styles.badge, { backgroundColor: Palette.dangerLight }]}>
        <AlertCircle size={13} color={Palette.danger} />
        <Text style={[styles.text, { color: Palette.danger }]}>
          Atrasado ({absDays} {absDays === 1 ? 'día' : 'días'})
        </Text>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={[styles.badge, { backgroundColor: Palette.warningLight }]}>
        <Clock size={13} color={Palette.warning} />
        <Text style={[styles.text, { color: Palette.warning }]}>
          {daysRemaining === 0 ? 'Para hoy' : `Pronto (${daysRemaining} d)`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: Palette.sageLight }]}>
      <CalendarCheck size={13} color={Palette.forest} />
      <Text style={[styles.text, { color: Palette.forest }]}>
        En {daysRemaining} días
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

