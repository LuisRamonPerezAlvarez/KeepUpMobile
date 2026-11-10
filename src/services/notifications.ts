import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar comportamiento por defecto de notificaciones locales
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita permisos para notificaciones locales
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('keepup-reminders', {
      name: 'Recordatorios de Mantenimiento',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#244B3A',
    });
  }

  return true;
}

/**
 * Programa una notificación local para un mantenimiento
 * Si la fecha ya pasó, no la programa
 */
export async function scheduleTaskNotification(
  taskId: string,
  taskTitle: string,
  assetName: string,
  targetDateStr: string // YYYY-MM-DD
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const [year, month, day] = targetDateStr.split('-').map(Number);
    // Programar a las 9:00 AM del día del mantenimiento
    const triggerDate = new Date(year, month - 1, day, 9, 0, 0);

    const now = new Date();
    if (triggerDate.getTime() <= now.getTime()) {
      // Si la fecha objetivo ya pasó o es hoy antes de las 9am, programamos 10 segundos en adelante como recordatorio inmediato
      return null;
    }

    const content: Notifications.NotificationContentInput = {
      title: `Mantenimiento pendiente: ${taskTitle}`,
      body: `Es momento de realizar el mantenimiento de tu ${assetName}.`,
      data: { taskId },
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'keepup-reminders',
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Error programando notificación:', error);
    return null;
  }
}

/**
 * Cancela una notificación programada por su ID
 */
export async function cancelNotification(notificationId?: string | null): Promise<void> {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Error cancelando notificación:', error);
  }
}
