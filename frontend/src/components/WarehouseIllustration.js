import React from 'react';
import Svg, { Rect, Path, Circle, Line, G } from 'react-native-svg';

export default function WarehouseIllustration() {
  return (
    <Svg width="220" height="160" viewBox="0 0 220 160">
      {/* Ground */}
      <Rect x="0" y="140" width="220" height="20" fill="#E5E7EB" />
      {/* Building body */}
      <Rect x="30" y="70" width="160" height="72" fill="#D1D5DB" rx="4" />
      {/* Roof */}
      <Path d="M20 72 L110 30 L200 72 Z" fill="#9CA3AF" />
      {/* Door */}
      <Rect x="85" y="100" width="50" height="42" fill="#6B7280" rx="3" />
      {/* Door handle */}
      <Circle cx="128" cy="122" r="3" fill="#D1D5DB" />
      {/* Windows */}
      <Rect x="45" y="90" width="28" height="22" fill="#BFDBFE" rx="2" />
      <Rect x="147" y="90" width="28" height="22" fill="#BFDBFE" rx="2" />
      {/* Window cross */}
      <Line x1="59" y1="90" x2="59" y2="112" stroke="#93C5FD" strokeWidth="1" />
      <Line x1="45" y1="101" x2="73" y2="101" stroke="#93C5FD" strokeWidth="1" />
      <Line x1="161" y1="90" x2="161" y2="112" stroke="#93C5FD" strokeWidth="1" />
      <Line x1="147" y1="101" x2="175" y2="101" stroke="#93C5FD" strokeWidth="1" />
      {/* Boxes */}
      <Rect x="35" y="120" width="22" height="20" fill="#F97316" rx="2" />
      <Rect x="163" y="120" width="22" height="20" fill="#0F766E" rx="2" />
    </Svg>
  );
}
