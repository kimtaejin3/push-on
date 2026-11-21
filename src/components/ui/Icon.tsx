import React from 'react';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CloudOff,
  Dumbbell,
  FileText,
  Flag,
  House,
  Inbox,
  Info,
  Lock,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Route,
  Settings,
  Snowflake,
  Trophy,
  UserRoundX,
  WifiOff,
  X,
  Zap,
} from 'lucide-react-native';
import {color} from '../../theme';

const icons = {
  bell: Bell,
  'calendar-check': CalendarCheck,
  'calendar-days': CalendarDays,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-check': CircleCheck,
  'cloud-off': CloudOff,
  dumbbell: Dumbbell,
  'file-text': FileText,
  flag: Flag,
  house: House,
  inbox: Inbox,
  info: Info,
  lock: Lock,
  minus: Minus,
  pause: Pause,
  play: Play,
  plus: Plus,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  route: Route,
  settings: Settings,
  snowflake: Snowflake,
  trophy: Trophy,
  'user-round-x': UserRoundX,
  'wifi-off': WifiOff,
  x: X,
  zap: Zap,
};

export type LucideName = keyof typeof icons;

interface IconProps {
  name: LucideName;
  size?: number;
  color?: keyof typeof color;
}

export function Icon({name, size = 20, color: tint = 'text'}: IconProps) {
  const Glyph = icons[name];
  return <Glyph size={size} color={color[tint]} accessible={false} />;
}
