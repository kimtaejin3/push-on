import {useState} from 'react';
import {encouragements, firstEncouragement} from '../constants/pushUp';

const getRandomEncouragement = () => {
  const randomIndex = Math.floor(Math.random() * encouragements.length);
  return encouragements[randomIndex];
};

function useHandleEngagements() {
  const [encouragement, setEncouragement] = useState('');

  const setRandomEncouragement = () => {
    setEncouragement(getRandomEncouragement());
  };

  const setFirstEncouragement = () => {
    setEncouragement(firstEncouragement);
  };

  return {
    encouragement,
    setRandomEncouragement,
    setFirstEncouragement,
  };
}

export default useHandleEngagements;
