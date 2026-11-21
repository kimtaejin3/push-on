import React from 'react';
import {View} from 'react-native';
import {color} from '../../../theme';

interface SkeletonProps {
  width: number | 'fill';
  height: number;
  radius?: number;
}

export function Skeleton({width, height, radius = 6}: SkeletonProps) {
  const measuredWidth = width === 'fill' ? '100%' : width;

  return (
    <View
      accessible={false}
      style={{
        width: measuredWidth,
        height,
        borderRadius: radius,
        backgroundColor: color.surface2,
      }}
    />
  );
}
