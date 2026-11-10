import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Bell,
  Cloud,
  CheckCircle,
  Radio,
  LogOut,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermissions } from '@/services/notifications';

export default function SettingsScreen() {
  const { syncPendingCount, stats, isOnline, lastSyncTime, refreshData } = useData();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      setNotificationsEnabled(granted);
      if (!granted) {
        Alert.alert(
          'Permisos requeridos',
          'Para recibir recordatorios de mantenimiento, habilita las notificaciones en Android.'
        );
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cuenta y Usuario Conectado */}
        <Text style={styles.sectionHeader}>Cuenta Supabase</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: Palette.sageLight }]}>
              <User size={20} color={Palette.forest} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{user?.email || 'Usuario'}</Text>
              <Text style={styles.rowSubtitle}>
                Sincronización compartida con KeepUp Watch
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={16} color={Palette.danger} />
            <Text style={styles.signOutBtnText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Estado de Sincronización en la Nube */}
        <Text style={styles.sectionHeader}>Sincronización y Realtime</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Cloud size={20} color="#6D28D9" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Supabase Realtime</Text>
              <Text style={styles.rowSubtitle}>
                {isOnline ? 'Canal en vivo conectado' : 'Modo local sin conexión'}
              </Text>
            </View>
          </View>

          <View style={styles.syncStatusBox}>
            <CheckCircle size={16} color={isOnline ? Palette.forest : Palette.warning} />
            <Text style={styles.syncStatusText}>
              {lastSyncTime
                ? `Última sincronización: ${new Date(lastSyncTime).toLocaleTimeString('es-ES')}`
                : 'Sincronizando con Supabase...'}
            </Text>
          </View>

          {syncPendingCount > 0 && (
            <View style={[styles.syncStatusBox, { backgroundColor: Palette.warningLight, marginTop: 8 }]}>
              <Text style={[styles.syncStatusText, { color: Palette.warning }]}>
                {syncPendingCount} operaciones pendientes de subir
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.refreshSyncBtn} onPress={refreshData}>
            <RefreshCw size={15} color={Palette.white} />
            <Text style={styles.refreshSyncBtnText}>Sincronizar Ahora</Text>
          </TouchableOpacity>
        </View>

        {/* Notificaciones */}
        <Text style={styles.sectionHeader}>Recordatorios y Avisos</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Bell size={20} color={Palette.forest} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Recordatorios Locales</Text>
              <Text style={styles.rowSubtitle}>
                Notificaciones en este teléfono a las 9:00 AM para tareas programadas.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              thumbColor={notificationsEnabled ? Palette.forest : '#E0E0E0'}
              trackColor={{ false: '#D1D5DB', true: Palette.sageLight }}
            />
          </View>
        </View>

        {/* Resumen de Datos */}
        <Text style={styles.sectionHeader}>Métricas del Sistema</Text>
        <View style={styles.card}>
          <View style={styles.dataStatsRow}>
            <View style={styles.dataStatItem}>
              <Text style={styles.dataStatVal}>{stats.totalAssets}</Text>
              <Text style={styles.dataStatLab}>Objetos</Text>
            </View>
            <View style={styles.dataStatItem}>
              <Text style={styles.dataStatVal}>{stats.totalTasks}</Text>
              <Text style={styles.dataStatLab}>Tareas</Text>
            </View>
            <View style={styles.dataStatItem}>
              <Text style={styles.dataStatVal}>{stats.completedTasks}</Text>
              <Text style={styles.dataStatLab}>Completados</Text>
            </View>
          </View>
        </View>

        {/* Acerca de */}
        <Text style={styles.sectionHeader}>Acerca de KeepUp</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.0.0 (Android)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plataforma</Text>
            <Text style={styles.infoValue}>Expo SDK 58 / React Native</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend</Text>
            <Text style={styles.infoValue}>Supabase Postgres + Realtime</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.dangerLight,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  signOutBtnText: {
    color: Palette.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  syncStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.sageLight,
    padding: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  syncStatusText: {
    fontSize: 12,
    color: Palette.forest,
    fontWeight: '600',
    flex: 1,
  },
  refreshSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forest,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 10,
  },
  refreshSyncBtnText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  dataStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  dataStatItem: {
    alignItems: 'center',
  },
  dataStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  dataStatLab: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F8F4',
  },
  infoLabel: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.charcoal,
  },
});
