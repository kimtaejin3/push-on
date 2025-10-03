# 환경변수 설정 가이드

## 1. .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 2. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Settings > API에서 다음 정보를 복사:
   - Project URL → `SUPABASE_URL`
   - Project API keys > anon public → `SUPABASE_ANON_KEY`

## 3. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- 푸쉬업 기록 테이블
CREATE TABLE pushup_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  count INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pushup_records ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 사용자는 자신의 푸쉬업 기록만 볼 수 있음
CREATE POLICY "Users can view own pushup records" ON pushup_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pushup records" ON pushup_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pushup records" ON pushup_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pushup records" ON pushup_records
  FOR DELETE USING (auth.uid() = user_id);
```

## 4. 앱 재시작

환경변수 변경 후 Metro 서버를 재시작하세요:

```bash
npx react-native start --reset-cache
```

## 5. 사용 예시

```typescript
import {supabase} from './src/config/supabase';

// 로그인
const {data, error} = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// 푸쉬업 기록 저장
const {data, error} = await supabase.from('pushup_records').insert([
  {
    user_id: user.id,
    count: 50,
    date: '2024-01-15',
  },
]);
```
