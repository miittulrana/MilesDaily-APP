import * as React from 'react';
import Svg, { Text } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

export default function Logo({ width = 100, height = 40 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 40">
      <Text
        fill={Colors.primary}
        fontFamily="System"
        fontSize="24"
        fontWeight="bold"
        x="50"
        y="25"
        textAnchor="middle"
      >
        MXPD
      </Text>
    </Svg>
  );
}