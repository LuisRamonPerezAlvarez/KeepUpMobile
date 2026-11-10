export const MAX_TEXT_LENGTH = 255;

export function limitText(value: string): string {
  return value.slice(0, MAX_TEXT_LENGTH);
}

export function trimmedText(value: string): string {
  return value.trim().slice(0, MAX_TEXT_LENGTH);
}

export function validateText(value: string, label: string, required = false): string | undefined {
  const trimmed = value.trim();
  if (required && !trimmed) return `${label} es obligatorio`;
  if (value.length > MAX_TEXT_LENGTH) return `${label} no puede superar 255 caracteres`;
  return undefined;
}

export function onlyDigits(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function validateInteger(value: string, label: string, required = true, max = 999999999): string | undefined {
  if (!value.trim()) return required ? `${label} es obligatorio` : undefined;
  if (!/^\d+$/.test(value)) return `${label} debe ser un número entero no negativo`;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) return `${label} supera el límite permitido`;
  return undefined;
}

export function validateMoney(value: string, label: string, required = false): string | undefined {
  if (!value.trim()) return required ? `${label} es obligatorio` : undefined;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return `${label} debe ser no negativo y tener máximo 6 dígitos enteros`;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return `${label} debe ser una cantidad no negativa`;
  return undefined;
}

export function limitMoney(value: string): string {
  const sanitized = value.replace(/[^0-9.]/g, '');
  const [integerPart = '', decimalPart] = sanitized.split('.');
  const integer = integerPart.slice(0, 6);
  return decimalPart === undefined ? integer : `${integer}.${decimalPart.slice(0, 2)}`;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function dateToString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
