import React from 'react';
import {FeedbackState, type StateProps} from './EmptyState';

export function ErrorState(props: StateProps) {
  return <FeedbackState {...props} tone="error" />;
}
