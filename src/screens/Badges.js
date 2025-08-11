// components/Badge.js
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const badgeColors = {
  bronze: ['#cd7f32', '#a97142'],
  silver: ['#C0C0C0', '#8C8C8C'],
  gold: ['#FFD700', '#E6C200'],
  diamond: ['#8b5cf6', '#6d28d9'], // violet gradient
};

export default function Badge({ level = 'bronze', size = 60 }) {
  const colors = badgeColors[level] || badgeColors.bronze;

  return (
    <View className="items-center mr-4">
      <Svg height={size} width={size}>
        <Defs>
          <LinearGradient id={`grad-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) - 3}
          fill={`url(#grad-${level})`}
          stroke="white"
          strokeWidth="3"
        />
      </Svg>
      <Text className="text-white text-xs mt-1 font-bold">
        {level.toUpperCase()}
      </Text>
    </View>
  );
}
