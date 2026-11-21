import React, {useRef} from 'react';
import {StackActions, useNavigation} from '@react-navigation/native';
import {useSavePushupSessionMutation} from '../../../tanstack-query';
import {useStreakCelebration} from '../streak/StreakCelebrationProvider';
import {Card} from '../../ui/Card';
import {Text} from '../../ui/Text';
import {ResultLayout} from '../result/ResultLayout';

interface ChallengeResultProps {
  pushUpCount: number;
  duration: number;
  /** 도전을 시작한 시각. 지난번·최고 기록은 이보다 앞선 기록과 비교한다 */
  beforeIso: string;
}

type Destination = 'Home' | 'History';

/** 챌린지 모드 결과 화면. (100개 챌린지의 테스트 결과는 ProgramTestResult 가 맡는다) */
function ChallengeResult({pushUpCount, duration, beforeIso}: ChallengeResultProps): React.JSX.Element {
  const navigation = useNavigation();

  // navigate 는 기존 화면으로 돌아가지 않고 새로 쌓으므로(React Navigation 7) popTo 로 돌아간다
  const destination = useRef<Destination>('Home');
  const goNext = () =>
    navigation.dispatch(StackActions.popTo('Tabs', {screen: destination.current}));
  const {celebrateThen} = useStreakCelebration();

  // 저장(또는 폰에 보관)됐으면 오늘 운동한 것이다 → 그날 첫 운동이면 축하 화면을 거친다.
  // 저장하지 않는 0개 결과와 저장 실패(로그인 안 됨)는 바로 이동한다
  const savePushupMutation = useSavePushupSessionMutation(() => celebrateThen(goNext), error => {
    console.error('푸쉬업 세션 저장 실패:', error);
    goNext();
  });

  // 이 화면에서는 한 번만 저장한다. 다시 누르면 새 시각으로 한 번 더 저장되어 중복 확인으로도 걸러지지 않는다.
  // 저장이 끝난 뒤에도 축하 화면 준비(최대 1.5초) 동안 이 화면에 머무르므로 isPending 만으로는 막지 못한다
  const saveStarted = useRef(false);

  // [확인]·[기록에서 보기] 모두 결과를 기록한 뒤 떠난다 (목적지만 다르다)
  const saveAndGo = (to: Destination) => {
    if (pushUpCount === 0 || saveStarted.current) {
      return;
    }
    saveStarted.current = true;
    destination.current = to;
    savePushupMutation.mutate({
      reps: pushUpCount,
      duration_seconds: duration,
      mode: 'challenge',
    });
  };

  const saving = savePushupMutation.isPending || savePushupMutation.isSuccess;

  if (pushUpCount === 0) {
    return (
      <ResultLayout
        mode="challenge"
        beforeIso={beforeIso}
        completion="한 번에 몇 개? · 측정 안 됨"
        neutral
        results={[0]}
        seconds={duration}
        headline="측정된 푸쉬업 횟수가 없어요"
        action={{title: '확인', onPress: goNext}}>
        <Card>
          <Text color="textMuted">0개는 기록에 남기지 않아요. 다시 시도해 보세요.</Text>
        </Card>
      </ResultLayout>
    );
  }

  return (
    <ResultLayout
      mode="challenge"
      beforeIso={beforeIso}
      completion="한 번에 몇 개?"
      results={[pushUpCount]}
      seconds={duration}
      action={{title: '확인', onPress: () => saveAndGo('Home'), loading: saving}}
      onHistory={() => saveAndGo('History')}
    />
  );
}

export default ChallengeResult;
