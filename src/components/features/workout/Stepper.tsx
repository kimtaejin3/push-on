import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../../constants/colors';

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Stepper({label, value, unit, min, max, step, onChange}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={dec} disabled={value <= min} style={styles.button}>
          <Text style={[styles.buttonText, value <= min && styles.disabled]}>−</Text>
        </Pressable>
        <Text style={styles.value}>
          {value}
          <Text style={styles.unit}> {unit}</Text>
        </Text>
        <Pressable onPress={inc} disabled={value >= max} style={styles.button}>
          <Text style={[styles.buttonText, value >= max && styles.disabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12},
  label: {fontSize: 16, color: colors.textLight},
  controls: {flexDirection: 'row', alignItems: 'center', gap: 8},
  button: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlayMedium},
  buttonText: {fontSize: 22, color: colors.textLight},
  disabled: {opacity: 0.3},
  value: {minWidth: 72, textAlign: 'center', fontSize: 18, fontWeight: '600', color: colors.textLight},
  unit: {fontSize: 13, fontWeight: '400', color: colors.gray400},
});

export default Stepper;
