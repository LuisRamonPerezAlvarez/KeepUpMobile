import { MaintenanceFrequencyUnit, TaskStatus } from '@/types/models';

/**
 * Formatea una fecha YYYY-MM-DD en formato legible en español
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No registrado';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('es-ES');
  } catch {
    return dateString;
  }
}

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula la próxima fecha a partir de una fecha base y su frecuencia
 */
export function calculateNextDate(
  fromDate: string,
  frequencyValue: number,
  frequencyUnit: MaintenanceFrequencyUnit
): string {
  const parts = fromDate.split('-');
  let baseDate: Date;
  if (parts.length === 3) {
    baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    baseDate = new Date(fromDate);
  }

  const result = new Date(baseDate);

  switch (frequencyUnit) {
    case 'days':
      result.setDate(result.getDate() + frequencyValue);
      break;
    case 'weeks':
      result.setDate(result.getDate() + frequencyValue * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + frequencyValue);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + frequencyValue);
      break;
  }

  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const day = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Suma días a una fecha YYYY-MM-DD
 */
export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  const parts = dateStr.split('-');
  let base: Date;
  if (parts.length === 3) {
    base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    base = new Date(dateStr);
  }
  base.setDate(base.getDate() + daysToAdd);

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula la diferencia en días entre la fecha actual y la fecha dada.
 * Positivo: faltan días. Negativo: atrasado. Cero: hoy.
 */
export function getDaysRemaining(targetDateStr: string): number {
  const todayStr = getTodayDateString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [ny, nm, nd] = targetDateStr.split('-').map(Number);

  const today = new Date(ty, tm - 1, td).getTime();
  const target = new Date(ny, nm - 1, nd).getTime();

  const diffTime = target - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina el estado del mantenimiento:
 * - 'overdue': Fecha pasada (< 0 días)
 * - 'pending': Hoy o en los próximos 7 días (0 a 7 días)
 * - 'upcoming': Más de 7 días (> 7 días)
 */
export function getTaskStatus(nextDate: string): TaskStatus {
  const days = getDaysRemaining(nextDate);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'pending';
  return 'upcoming';
}

/**
 * Traducción amigable de frecuencias
 */
export function formatFrequency(value: number, unit: MaintenanceFrequencyUnit): string {
  const unitNames: Record<MaintenanceFrequencyUnit, { singular: string; plural: string }> = {
    days: { singular: 'día', plural: 'días' },
    weeks: { singular: 'semana', plural: 'semanas' },
    months: { singular: 'mes', plural: 'meses' },
    years: { singular: 'año', plural: 'años' },
  };

  const name = value === 1 ? unitNames[unit].singular : unitNames[unit].plural;
  return `Cada ${value} ${name}`;
}
