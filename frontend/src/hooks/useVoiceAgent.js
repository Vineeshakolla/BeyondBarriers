import { useContext } from 'react';
import VoiceContext from '../context/VoiceContext';

export const useVoiceAgent = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceAgent must be used within a VoiceProvider');
  }
  return context;
};

export default useVoiceAgent;
