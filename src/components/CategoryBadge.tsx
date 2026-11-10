import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Laptop,
  Car,
  Home,
  Wrench,
  HelpCircle,
  LucideIcon,
} from 'lucide-react-native';
import { AssetCategory } from '@/types/models';
import { Palette } from '@/constants/Colors';

interface CategoryBadgeProps {
  category: AssetCategory;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

const CATEGORY_MAP: Record<
  AssetCategory,
  { label: string; icon: LucideIcon; bg: string; color: string }
> = {
  electronica: {
    label: 'Electrónica',
    icon: Laptop,
    bg: '#E0F2FE',
    color: '#0369A1',
  },
  transporte: {
    label: 'Transporte',
    icon: Car,
    bg: '#FEF3C7',
    color: '#B45309',
  },
  hogar: {
    label: 'Hogar',
    icon: Home,
    bg: '#DCFCE7',
    color: '#15803D',
  },
  herramientas: {
    label: 'Herramientas',
    icon: Wrench,
    bg: '#F3E8FF',
    color: '#7E22CE',
  },
  otras: {
    label: 'Otras',
    icon: HelpCircle,
    bg: '#F1F5F9',
    color: '#475569',
  },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'small',
  showLabel = true,
}) => {
  const info = CATEGORY_MAP[category] || CATEGORY_MAP.otras;
  const IconComponent = info.icon;
  const iconSize = size === 'small' ? 14 : 18;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: info.bg },
        size === 'medium' && styles.badgeMedium,
      ]}>
      <IconComponent size={iconSize} color={info.color} />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: info.color },
            size === 'medium' && styles.labelMedium,
          ]}>
          {info.label}
        </Text>
      )}
    </View>
  );
};

export function getCategoryInfo(category: AssetCategory) {
  return CATEGORY_MAP[category] || CATEGORY_MAP.otras;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelMedium: {
    fontSize: 13,
  },
});

