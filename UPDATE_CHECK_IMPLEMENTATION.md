# 앱 업데이트 체크 기능 구현 가이드

## 📋 개요

이 문서는 앱 업데이트 체크 기능의 구현 방법과 작동 원리를 상세히 설명합니다.

## 🎯 구현 목표

- 사용자가 앱을 업데이트하지 않아도 새 버전 알림을 받을 수 있도록 함
- Supabase를 활용한 원격 설정 방식
- 하루에 한 번만 체크하여 불필요한 API 호출 방지

## 📁 구현된 파일 구조

```
pushupApp/
├── APP_UPDATE_TABLE.sql                    # Supabase 테이블 생성 SQL
├── src/
│   ├── utils/
│   │   └── version.ts                      # 버전 비교 유틸리티
│   ├── remote/
│   │   └── app.ts                          # Supabase 버전 조회 함수
│   ├── components/
│   │   └── common/
│   │       └── UpdateModal.tsx             # 업데이트 모달 UI
│   └── App.tsx                             # 업데이트 체크 로직 통합
```

## 🔧 단계별 구현 상세

### 1단계: Supabase 테이블 생성

**파일:** `APP_UPDATE_TABLE.sql`

**목적:**
- 앱 버전 정보를 저장하는 테이블 생성
- 새 버전 출시 시 이 테이블에만 데이터를 추가하면 기존 앱이 자동으로 알림 표시

**테이블 구조:**
```sql
app_versions
├── id (UUID, Primary Key)
├── version (TEXT, Unique)        # 버전 번호 (예: "0.0.1")
├── force_update (BOOLEAN)         # 강제 업데이트 여부
├── release_notes (TEXT)          # 업데이트 노트
└── created_at (TIMESTAMP)        # 생성 시간
```

**RLS 정책:**
- 모든 사용자가 읽을 수 있도록 설정 (인증 불필요)
- 쓰기는 관리자만 가능 (Supabase Dashboard에서)

**사용 방법:**
```sql
-- 새 버전 출시 시
INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '0.0.2',
  false,
  '리더보드 기능 강화
- 일일, 월간, 연간 순위를 한눈에 확인할 수 있습니다'
);
```

### 2단계: 버전 비교 유틸리티

**파일:** `src/utils/version.ts`

**주요 함수:**

#### `parseVersion(version: string): number[]`
- 버전 문자열을 숫자 배열로 변환
- 예: `"1.0.1"` → `[1, 0, 1]`

#### `isVersionNewer(version1: string, version2: string): boolean`
- 두 버전을 비교하여 version1이 더 최신인지 확인
- Major.Minor.Patch 형식 지원
- 예: `isVersionNewer("1.0.1", "1.0.0")` → `true`

#### `CURRENT_APP_VERSION`
- 현재 앱 버전 상수
- **중요:** 새 버전 출시 시 이 값을 업데이트해야 함

**작동 원리:**
1. 버전 문자열을 점(.)으로 분리
2. 각 자릿수(Major, Minor, Patch)를 순서대로 비교
3. 더 큰 숫자가 나오면 해당 버전이 더 최신

### 3단계: Supabase 버전 조회 함수

**파일:** `src/remote/app.ts`

**주요 함수:**

#### `getLatestAppVersion(): Promise<AppVersion | null>`
- Supabase에서 최신 버전 정보 조회
- `created_at` 기준으로 최신 버전만 가져옴
- 에러 발생 시 `null` 반환 (앱은 정상 작동)

**에러 처리:**
- 네트워크 에러, 테이블 없음 등 모든 경우에 대해 안전하게 처리
- 에러 발생해도 앱은 계속 작동

### 4단계: 업데이트 모달 컴포넌트

**파일:** `src/components/common/UpdateModal.tsx`

**주요 기능:**
- 업데이트 알림 모달 UI
- 업데이트 노트 표시 (스크롤 가능)
- 강제 업데이트 모드 지원
- 플레이스토어 링크 열기

**Props:**
- `visible`: 모달 표시/숨김
- `releaseNotes`: 업데이트 노트 텍스트
- `forceUpdate`: 강제 업데이트 여부 (true면 "나중에" 버튼 숨김)
- `onUpdate`: "업데이트하기" 버튼 클릭 시 호출
- `onDismiss`: "나중에" 버튼 클릭 시 호출 (강제 업데이트가 아닐 때만)

**플레이스토어 링크:**
- `market://details?id=com.pushupapp` (앱으로 열기)
- 실패 시 `https://play.google.com/...` (웹으로 열기)

### 5단계: App.tsx 통합

**파일:** `App.tsx`

**주요 로직:**

#### `checkAppUpdate()` 함수
1. **마지막 체크 날짜 확인**
   - AsyncStorage에서 마지막 체크 날짜 조회
   - 오늘 이미 체크했으면 스킵 (하루에 한 번만)

2. **현재 버전 가져오기**
   - `getCurrentAppVersion()` 사용
   - 현재는 `"0.0.1"` 하드코딩

3. **최신 버전 조회**
   - `getLatestAppVersion()` 호출
   - Supabase에서 최신 버전 정보 가져오기

4. **버전 비교**
   - `isVersionNewer()` 사용
   - 최신 버전이 더 새롭면 모달 표시

5. **체크 날짜 저장**
   - 오늘 날짜를 AsyncStorage에 저장

**최적화:**
- 하루에 한 번만 체크하여 API 호출 최소화
- 에러 발생 시에도 앱은 정상 작동

## 🔄 전체 작동 흐름

```
1. 앱 시작
   ↓
2. App.tsx의 useEffect 실행
   ↓
3. checkAppUpdate() 호출
   ↓
4. AsyncStorage에서 마지막 체크 날짜 확인
   ├─ 오늘 이미 체크했으면 → 종료
   └─ 아니면 계속
   ↓
5. getCurrentAppVersion() → "0.0.1"
   ↓
6. getLatestAppVersion() → Supabase 조회
   ├─ 에러 발생 → 종료 (앱은 정상 작동)
   └─ 성공 → 최신 버전 정보 가져옴
   ↓
7. isVersionNewer("0.0.2", "0.0.1") → true
   ↓
8. UpdateModal 표시
   ↓
9. 사용자가 "업데이트하기" 클릭
   ↓
10. 플레이스토어로 이동
```

## 📝 새 버전 출시 시 작업

### 1. 코드 수정
```typescript
// src/utils/version.ts
export const CURRENT_APP_VERSION = '0.0.2'; // 업데이트
```

### 2. Supabase에 버전 정보 추가
```sql
INSERT INTO app_versions (version, force_update, release_notes)
VALUES (
  '0.0.2',
  false, -- 강제 업데이트 여부
  '리더보드 기능 강화
- 일일, 월간, 연간 순위를 한눈에 확인할 수 있습니다
- 리더보드 조회 속도가 빨라졌습니다'
);
```

### 3. 앱 빌드 및 배포
- 플레이스토어에 새 버전 업로드

### 4. 결과
- 기존 사용자(0.0.1)가 앱을 열면 자동으로 업데이트 알림 표시
- 업데이트하지 않은 사용자도 알림 받음

## ⚙️ 설정 가능한 옵션

### 체크 간격 변경
```typescript
// App.tsx
const UPDATE_CHECK_INTERVAL_DAYS = 1; // 하루에 한 번
// 또는
const UPDATE_CHECK_INTERVAL_DAYS = 7; // 일주일에 한 번
```

### 강제 업데이트 설정
```sql
-- Supabase에서
UPDATE app_versions 
SET force_update = true 
WHERE version = '0.0.2';
```

강제 업데이트가 `true`면:
- "나중에" 버튼이 숨겨짐
- 사용자는 반드시 업데이트해야 함

## 🐛 문제 해결

### 업데이트 알림이 안 뜨는 경우
1. Supabase 테이블이 생성되었는지 확인
2. 버전 정보가 올바르게 입력되었는지 확인
3. `CURRENT_APP_VERSION`이 올바른지 확인
4. 콘솔 로그 확인 (`[업데이트 체크]`)

### 플레이스토어 링크가 안 열리는 경우
- `com.pushupapp` 패키지명이 올바른지 확인
- `UpdateModal.tsx`의 `packageName` 수정

## 📊 성능 고려사항

- **API 호출 최소화**: 하루에 한 번만 체크
- **에러 처리**: 모든 에러에 대해 안전하게 처리
- **비동기 처리**: 앱 시작을 블로킹하지 않음
- **메모리**: 모달은 필요할 때만 렌더링

## 🔐 보안 고려사항

- RLS 정책으로 읽기만 허용
- 쓰기는 Supabase Dashboard에서만 가능
- 버전 정보는 공개되어도 문제없음

## ✅ 체크리스트

새 버전 출시 전:
- [ ] `CURRENT_APP_VERSION` 업데이트
- [ ] Supabase에 버전 정보 추가
- [ ] 업데이트 노트 작성
- [ ] 강제 업데이트 여부 결정
- [ ] 테스트 (기존 버전에서 새 버전 알림 확인)

