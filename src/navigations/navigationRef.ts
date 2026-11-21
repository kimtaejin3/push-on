import {createNavigationContainerRef} from '@react-navigation/native';
import type {AppStackParamList} from './AppNavigation';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();
