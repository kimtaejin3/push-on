import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {Sparkles} from 'lucide-react-native';
import {SetupStepper} from '../components/features/sets/SetupStepper';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {Chip} from '../components/ui/Chip';
import {ScreenHeader} from '../components/ui/ScreenHeader';
import {Text} from '../components/ui/Text';
import {Skeleton} from '../components/ui/feedback/Skeleton';
import {useToast} from '../components/ui/feedback/ToastProvider';
import {suggestFreeSets} from '../domain/freeSetSuggestion';
import {useSession} from '../hooks/useSession';
import {getBestSetBefore} from '../remote/workoutHistory';
import {queryKeys} from '../tanstack-query/queryKeys';
import {color, layout, radius, space} from '../theme';
import {
  SETS_LIMITS,
  SETS_PRESETS,
  type SetsConfig,
  clampSetsConfig,
  loadLastSetsConfig,
  saveLastSetsConfig,
  toWorkoutPlan,
} from '../utils/setsPreset';

const presetLabels = ['가볍게', '보통', '강하게'];
const fields = [
  {key: 'sets', label: '세트', unit: '세트'},
  {key: 'reps', label: '목표', unit: '개'},
  {key: 'rest', label: '휴식', unit: '초'},
] as const;

const sameConfig = (a: SetsConfig, b: SetsConfig) =>
  a.sets === b.sets && a.reps === b.reps && a.rest === b.rest;

export default function SetsSetupScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const {user} = useSession();
  const [config, setConfig] = useState<SetsConfig | null>(null);
  const [base, setBase] = useState<SetsConfig | null>(null);
  const [custom, setCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const starting = useRef(false);

  useEffect(() => {
    loadLastSetsConfig().then(initial => {
      setBase(initial);
      setConfig(initial);
    });
  }, []);

  const {data: best = null} = useQuery({
    queryKey: [...queryKeys.pushup.all, 'bestChallengeSet', user?.id],
    queryFn: () => getBestSetBefore(new Date().toISOString(), 'challenge'),
    enabled: !!user,
  });
  const suggestion = suggestFreeSets(best);
  const suggestedConfig = suggestion
    ? clampSetsConfig({
        sets: suggestion.sets,
        reps: suggestion.reps,
        rest: suggestion.restSeconds,
      })
    : null;
  const presetIndex =
    config && !custom
      ? SETS_PRESETS.findIndex(preset => sameConfig(preset.config, config))
      : -1;

  const handleStart = async () => {
    if (!config || starting.current) {
      return;
    }
    starting.current = true;
    setSaving(true);
    try {
      await saveLastSetsConfig(config);
      if (navigation.isFocused()) {
        navigation.navigate('Workout', {
          plan: toWorkoutPlan(config),
          source: {kind: 'sets'},
        });
      }
    } catch {
      toast.show('세트 설정을 저장하지 못했어요. 다시 시도해 주세요', {
        tone: 'alert',
      });
    } finally {
      starting.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="자유 세트" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {config ? (
          <>
            <Text variant="caption" color="textMuted" weight={600}>
              프리셋
            </Text>
            {suggestedConfig && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setConfig(suggestedConfig);
                  setCustom(false);
                }}
                style={({pressed}) => [
                  styles.suggestion,
                  pressed && styles.pressed,
                ]}>
                <Sparkles size={18} color={color.record} accessible={false} />
                <Text
                  variant="caption"
                  weight={700}
                  style={styles.suggestionLabel}>
                  최고 {best}개 기준 추천: {suggestedConfig.sets}세트 ×{' '}
                  {suggestedConfig.reps}개
                </Text>
                <Text variant="label" color="record" weight={800}>
                  적용
                </Text>
              </Pressable>
            )}
            <View style={styles.chips}>
              {SETS_PRESETS.map((preset, index) => (
                <Chip
                  key={preset.label}
                  label={presetLabels[index]}
                  selected={index === presetIndex}
                  onPress={() => {
                    setBase(preset.config);
                    setConfig(preset.config);
                    setCustom(false);
                  }}
                />
              ))}
              <Chip
                label="직접 설정"
                selected={presetIndex === -1}
                onPress={() => setCustom(true)}
              />
            </View>

            <View>
              {fields.map(({key, label, unit}) => (
                <SetupStepper
                  key={key}
                  label={label}
                  value={config[key]}
                  unit={unit}
                  {...SETS_LIMITS[key]}
                  changed={presetIndex === -1 && config[key] !== base?.[key]}
                  onChange={value =>
                    setConfig(
                      current =>
                        current && clampSetsConfig({...current, [key]: value}),
                    )
                  }
                />
              ))}
            </View>

            <Card style={styles.summary}>
              <Text weight={800}>
                {config.sets}세트 × {config.reps}개 · 휴식 {config.rest}초
              </Text>
              <Text variant="caption" color="textMuted">
                총 {config.sets * config.reps}개 · 약{' '}
                {Math.ceil(
                  (config.sets * config.reps * 3 +
                    (config.sets - 1) * config.rest) /
                    60,
                )}
                분
              </Text>
            </Card>
          </>
        ) : (
          <View
            accessibilityLabel="저장된 설정을 불러오는 중"
            accessibilityState={{busy: true}}>
            <View style={styles.chips}>
              {[72, 60, 72, 88].map((width, index) => (
                <Skeleton
                  key={index}
                  width={width}
                  height={40}
                  radius={radius.chip}
                />
              ))}
            </View>
            <Card style={styles.loadingCard}>
              <Skeleton width={96} height={12} />
              <Skeleton width={200} height={24} />
              <Skeleton width="fill" height={12} />
              <Skeleton width="fill" height={56} radius={radius.m} />
            </Card>
          </View>
        )}
        <View style={styles.footer}>
          <Button
            variant="primary"
            title="시작"
            icon="play"
            disabled={!config}
            loading={saving}
            onPress={handleStart}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[8],
    paddingBottom: space[24],
    gap: space[20],
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: space[8]},
  summary: {gap: space[4], padding: space[16]},
  loadingCard: {marginTop: space[20]},
  footer: {flexGrow: 1, justifyContent: 'flex-end'},
  suggestion: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: `${color.record}1F`,
    borderColor: `${color.record}66`,
    borderWidth: 1,
    borderRadius: radius.m,
    padding: space[12],
  },
  suggestionLabel: {flex: 1},
  pressed: {opacity: 0.7},
});
