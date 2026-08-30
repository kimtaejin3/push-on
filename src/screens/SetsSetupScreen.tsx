import React, {useEffect, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Header from '../components/common/Header';
import CustomButton from '../components/common/CustomButton';
import Stepper from '../components/features/workout/Stepper';
import {colors} from '../constants/colors';
import {
  SETS_LIMITS,
  SETS_PRESETS,
  SetsConfig,
  clampSetsConfig,
  loadLastSetsConfig,
  saveLastSetsConfig,
  toWorkoutPlan,
} from '../utils/setsPreset';

const sameConfig = (a: SetsConfig, b: SetsConfig) =>
  a.sets === b.sets && a.reps === b.reps && a.rest === b.rest;

function SetsSetupScreen() {
  const navigation = useNavigation();
  const [config, setConfig] = useState<SetsConfig | null>(null);

  useEffect(() => {
    loadLastSetsConfig().then(setConfig);
  }, []);

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="세트" onBackPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const update = (patch: Partial<SetsConfig>) =>
    setConfig(clampSetsConfig({...config, ...patch}));

  const handleStart = async () => {
    await saveLastSetsConfig(config);
    navigation.navigate('Workout', {plan: toWorkoutPlan(config), source: {kind: 'sets'}});
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="세트" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>프리셋</Text>
        <View style={styles.chips}>
          {SETS_PRESETS.map(preset => {
            const selected = sameConfig(preset.config, config);
            return (
              <Pressable
                key={preset.label}
                onPress={() => setConfig(preset.config)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>직접 설정</Text>
        <View style={styles.card}>
          <Stepper label="세트 수" value={config.sets} unit="세트" {...SETS_LIMITS.sets} onChange={v => update({sets: v})} />
          <Stepper label="세트당 목표" value={config.reps} unit="회" {...SETS_LIMITS.reps} onChange={v => update({reps: v})} />
          <Stepper label="세트 사이 휴식" value={config.rest} unit="초" {...SETS_LIMITS.rest} onChange={v => update({rest: v})} />
        </View>

        <Text style={styles.summary}>
          {config.sets}세트 × {config.reps}회 · 휴식 {config.rest}초
        </Text>
        <CustomButton title="시작" variant="start" style={styles.startButton} onPress={handleStart} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.backgroundDark},
  content: {padding: 20, gap: 12},
  sectionTitle: {fontSize: 14, color: colors.gray400, marginTop: 8},
  chips: {flexDirection: 'row', gap: 8},
  chip: {paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.overlayLight},
  chipSelected: {backgroundColor: colors.primary},
  chipText: {fontSize: 15, color: colors.textLight},
  chipTextSelected: {fontWeight: '600'},
  card: {backgroundColor: colors.overlayLight, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 8},
  summary: {textAlign: 'center', fontSize: 15, color: colors.textSecondary, marginTop: 8},
  startButton: {marginTop: 8},
});

export default SetsSetupScreen;
