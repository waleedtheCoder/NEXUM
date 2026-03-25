import React from 'react';
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';

export default function CityIllustration() {
  return (
    <Svg width="280" height="180" viewBox="0 0 280 180">
      {/* Sky */}
      <Rect x="0" y="0" width="280" height="180" fill="#F0FDF9" />
      {/* Ground */}
      <Rect x="0" y="150" width="280" height="30" fill="#D1FAE5" />
      {/* Building 1 */}
      <Rect x="10" y="80" width="50" height="72" fill="#0F766E" rx="3" />
      <Rect x="18" y="92" width="12" height="12" fill="#A7F3D0" rx="1" />
      <Rect x="36" y="92" width="12" height="12" fill="#A7F3D0" rx="1" />
      <Rect x="18" y="112" width="12" height="12" fill="#A7F3D0" rx="1" />
      <Rect x="36" y="112" width="12" height="12" fill="#A7F3D0" rx="1" />
      {/* Building 2 */}
      <Rect x="70" y="50" width="60" height="102" fill="#14B8A6" rx="3" />
      <Rect x="80" y="62" width="14" height="14" fill="#CCFBF1" rx="1" />
      <Rect x="102" y="62" width="14" height="14" fill="#CCFBF1" rx="1" />
      <Rect x="80" y="84" width="14" height="14" fill="#CCFBF1" rx="1" />
      <Rect x="102" y="84" width="14" height="14" fill="#CCFBF1" rx="1" />
      <Rect x="80" y="106" width="14" height="14" fill="#CCFBF1" rx="1" />
      <Rect x="102" y="106" width="14" height="14" fill="#CCFBF1" rx="1" />
      {/* Door */}
      <Rect x="90" y="128" width="20" height="24" fill="#0F766E" rx="2" />
      {/* Building 3 */}
      <Rect x="140" y="60" width="55" height="92" fill="#F97316" rx="3" />
      <Rect x="150" y="72" width="12" height="12" fill="#FED7AA" rx="1" />
      <Rect x="170" y="72" width="12" height="12" fill="#FED7AA" rx="1" />
      <Rect x="150" y="92" width="12" height="12" fill="#FED7AA" rx="1" />
      <Rect x="170" y="92" width="12" height="12" fill="#FED7AA" rx="1" />
      <Rect x="150" y="112" width="12" height="12" fill="#FED7AA" rx="1" />
      <Rect x="170" y="112" width="12" height="12" fill="#FED7AA" rx="1" />
      {/* Building 4 */}
      <Rect x="205" y="90" width="65" height="62" fill="#84CC16" rx="3" />
      <Rect x="215" y="102" width="14" height="12" fill="#D9F99D" rx="1" />
      <Rect x="237" y="102" width="14" height="12" fill="#D9F99D" rx="1" />
      <Rect x="215" y="122" width="14" height="12" fill="#D9F99D" rx="1" />
      <Rect x="237" y="122" width="14" height="12" fill="#D9F99D" rx="1" />
      {/* Sun */}
      <Circle cx="240" cy="35" r="22" fill="#FEF08A" />
      <Circle cx="240" cy="35" r="16" fill="#FDE047" />
    </Svg>
  );
}
