import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { speechSynthesisService } from '../services/speechSynthesisService';

/**
 * SECTION F — DETERMINISTIC STANDALONE COMMAND PARSER
 * Returns one of the exact prompt command tags or 'UNKNOWN'.
 */
export const parseVoiceCommand = (rawTranscript) => {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return { commandTag: 'UNKNOWN', cleanCmd: '' };
  }

  const cleanCmd = rawTranscript
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .trim();

  // 1. STOP
  if (
    cleanCmd === 'stop' || 
    cleanCmd === 'stop speech' || 
    cleanCmd === 'quiet' || 
    cleanCmd === 'silence' || 
    cleanCmd === 'halt' ||
    cleanCmd.includes('stop reading') ||
    cleanCmd === 'cancel'
  ) {
    return { commandTag: 'STOP', cleanCmd };
  }

  // 2. STOP_LISTENING
  if (
    cleanCmd === 'stop listening' || 
    cleanCmd === 'turn off microphone' || 
    cleanCmd === 'turn off mic' || 
    cleanCmd === 'disable voice'
  ) {
    return { commandTag: 'STOP_LISTENING', cleanCmd };
  }

  // 3. PAUSE
  if (cleanCmd === 'pause' || cleanCmd === 'pause speech' || cleanCmd === 'hold on' || cleanCmd === 'wait') {
    return { commandTag: 'PAUSE', cleanCmd };
  }

  // 4. CONTINUE / RESUME
  if (cleanCmd === 'continue') {
    return { commandTag: 'CONTINUE', cleanCmd };
  }
  if (cleanCmd === 'resume' || cleanCmd === 'play' || cleanCmd === 'go ahead' || cleanCmd === 'keep going') {
    return { commandTag: 'RESUME', cleanCmd };
  }

  // 5. REPEAT
  if (cleanCmd === 'repeat' || cleanCmd === 'repeat that' || cleanCmd === 'say again' || cleanCmd === 'what was that') {
    return { commandTag: 'REPEAT', cleanCmd };
  }

  // 6. READ_PAGE
  if (
    cleanCmd.includes('read page') ||
    cleanCmd.includes('read the page') ||
    cleanCmd.includes('read this page') ||
    cleanCmd.includes('read whole page') ||
    cleanCmd.includes('read dashboard') ||
    cleanCmd.includes('read screen') ||
    cleanCmd.includes('read content') ||
    cleanCmd.includes('read text') ||
    cleanCmd.includes('read all') ||
    cleanCmd.includes('read out') ||
    cleanCmd.includes('read aloud') ||
    cleanCmd.includes('read again') ||
    cleanCmd.includes('read') ||
    cleanCmd === 'speak'
  ) {
    return { commandTag: 'READ_PAGE', cleanCmd };
  }

  // 7. GO_BACK
  if (cleanCmd === 'go back' || cleanCmd === 'back' || cleanCmd === 'previous page') {
    return { commandTag: 'GO_BACK', cleanCmd };
  }

  // 8. TEST TAKING COMMANDS
  if (cleanCmd.includes('option a') || cleanCmd === 'select a' || cleanCmd === 'choose a' || cleanCmd === 'a') {
    return { commandTag: 'SELECT_OPTION_A', cleanCmd };
  }
  if (cleanCmd.includes('option b') || cleanCmd === 'select b' || cleanCmd === 'choose b' || cleanCmd === 'b') {
    return { commandTag: 'SELECT_OPTION_B', cleanCmd };
  }
  if (cleanCmd.includes('option c') || cleanCmd === 'select c' || cleanCmd === 'choose c' || cleanCmd === 'c') {
    return { commandTag: 'SELECT_OPTION_C', cleanCmd };
  }
  if (cleanCmd.includes('option d') || cleanCmd === 'select d' || cleanCmd === 'choose d' || cleanCmd === 'd') {
    return { commandTag: 'SELECT_OPTION_D', cleanCmd };
  }

  if (cleanCmd.includes('sure') || cleanCmd.includes('confident')) {
    return { commandTag: 'CONFIDENCE_SURE', cleanCmd };
  }
  if (cleanCmd.includes('guessing') || cleanCmd.includes('not sure') || cleanCmd.includes('guess')) {
    return { commandTag: 'CONFIDENCE_GUESSING', cleanCmd };
  }

  if (cleanCmd.includes('submit test') || cleanCmd.includes('finish test') || cleanCmd.includes('end test') || cleanCmd.includes('submit quiz')) {
    return { commandTag: 'SUBMIT_TEST', cleanCmd };
  }

  // 9. EXPLAIN_LESSON
  if (cleanCmd.includes('explain lesson') || cleanCmd.includes('lesson 1') || cleanCmd.includes('open lesson')) {
    return { commandTag: 'EXPLAIN_LESSON', cleanCmd };
  }

  // 10. START_TEST
  if (cleanCmd.includes('start test') || cleanCmd.includes('take test') || cleanCmd.includes('start the test') || cleanCmd.includes('begin test')) {
    return { commandTag: 'START_TEST', cleanCmd };
  }

  // 11. GO_DASHBOARD
  if (cleanCmd.includes('dashboard') || cleanCmd.includes('home') || cleanCmd === 'main page') {
    return { commandTag: 'GO_DASHBOARD', cleanCmd };
  }

  // 12. GO_MY_LEARNING
  if (cleanCmd.includes('learning') || cleanCmd.includes('course') || cleanCmd.includes('subject') || cleanCmd.includes('module')) {
    return { commandTag: 'GO_MY_LEARNING', cleanCmd };
  }

  // 13. GO_ATTENDANCE
  if (cleanCmd.includes('attendance') || cleanCmd.includes('mark') || cleanCmd.includes('grade') || cleanCmd.includes('score')) {
    return { commandTag: 'GO_ATTENDANCE', cleanCmd };
  }

  // 14. GO_SCHOLARSHIPS
  if (cleanCmd.includes('scholarship') || cleanCmd.includes('grant') || cleanCmd.includes('financial aid')) {
    return { commandTag: 'GO_SCHOLARSHIPS', cleanCmd };
  }

  // 15. GO_RESOURCES
  if (cleanCmd.includes('resource') || cleanCmd.includes('library') || cleanCmd.includes('study material') || cleanCmd.includes('textbook')) {
    return { commandTag: 'GO_RESOURCES', cleanCmd };
  }

  // 16. GO_CAREER
  if (cleanCmd.includes('career') || cleanCmd.includes('guidance') || cleanCmd.includes('roadmap') || cleanCmd.includes('future')) {
    return { commandTag: 'GO_CAREER', cleanCmd };
  }

  // 17. GO_ACCESSIBILITY
  if (cleanCmd.includes('accessibility') || cleanCmd.includes('a11y') || cleanCmd.includes('setting') || cleanCmd.includes('preference')) {
    return { commandTag: 'GO_ACCESSIBILITY', cleanCmd };
  }

  // 18. GO_PROFILE
  if (cleanCmd.includes('profile') || cleanCmd.includes('account') || cleanCmd.includes('my info')) {
    return { commandTag: 'GO_PROFILE', cleanCmd };
  }

  // 19. READ_RECOMMENDATIONS
  if (cleanCmd.includes('recommendation') || cleanCmd.includes('what to learn') || cleanCmd.includes('what should i study') || cleanCmd.includes('learning plan') || cleanCmd.includes('next lesson')) {
    return { commandTag: 'READ_RECOMMENDATIONS', cleanCmd };
  }

  // 20. CHATBOT DOUBT ASSISTANT COMMANDS
  if (cleanCmd.includes('ask a doubt') || cleanCmd.includes('ask doubt') || cleanCmd.includes('open chatbot') || cleanCmd.includes('doubt assistant')) {
    return { commandTag: 'ASK_DOUBT', cleanCmd };
  }
  if (cleanCmd.includes('read answer') || cleanCmd.includes('read the answer') || cleanCmd.includes('read latest answer') || cleanCmd.includes('repeat answer')) {
    return { commandTag: 'READ_ANSWER', cleanCmd };
  }

  return { commandTag: 'UNKNOWN', cleanCmd };
};

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // SECURITY & ACCESSIBILITY GUARDING: Voice Agent is available for Student role
  const isStudentRole = Boolean(isAuthenticated && user?.role === 'student');
  const isVisualStudent = isStudentRole;
  const isVoiceEligible = isStudentRole;

  // Enablement state (OFF by default for every student)
  const [voiceEnabledState, setVoiceEnabledState] = useState(() => {
    try {
      return localStorage.getItem('beyond_barriers_voice_enabled') === 'true';
    } catch (e) {
      return false;
    }
  });

  const voiceEnabled = isVoiceEligible && voiceEnabledState;

  // 2. EXPLICIT AGENT STATES:
  // 'READY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'PAUSED' | 'STOPPED' | 'NOT_SUPPORTED' | 'ERROR'
  const [agentState, setAgentState] = useState(() => {
    if (!speechRecognitionService.isSupported() || !speechSynthesisService.isSupported()) {
      return 'NOT_SUPPORTED';
    }
    return 'READY';
  });

  // Debugging & Transcript State (Requirement D & E)
  const [lastHeard, setLastHeard] = useState('');
  const [matchedCommand, setMatchedCommand] = useState('');
  const [currentCommand, setCurrentCommand] = useState('');
  const [lastSpokenContent, setLastSpokenContent] = useState('');
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [micErrorMsg, setMicErrorMsg] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);

  // Voice Settings
  const [voiceSettings, setVoiceSettings] = useState({
    autoReadPages: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    voiceName: '',
    highContrast: false,
    fontScale: '100%',
    dyslexicFont: false,
    colorblindMode: 'none'
  });

  const [availableVoices, setAvailableVoices] = useState([]);
  const pendingPageReadRef = useRef(null);
  const registeredSummariesRef = useRef({});
  const lastSpokenContentRef = useRef('');
  const navTimerRef = useRef(null);
  const voiceEnabledRef = useRef(voiceEnabled);
  const handleVoiceCommandRef = useRef(null);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Load available system voices
  useEffect(() => {
    const updateVoices = () => {
      if (speechSynthesisService.isSupported()) {
        const voices = speechSynthesisService.getVoices();
        setAvailableVoices(voices);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize Single Stable Speech Recognition Service (Section C)
  useEffect(() => {
    if (!speechRecognitionService.isSupported()) {
      setAgentState('NOT_SUPPORTED');
      setMicErrorMsg('Voice recognition is not supported in this browser.');
      return;
    }

    speechRecognitionService.init({
      onStart: () => {
        setAgentState('LISTENING');
        setMicErrorMsg('');
      },
      onResult: (transcript) => {
        // Immediately stop recognition after receiving transcript BEFORE starting TTS
        speechRecognitionService.stop();
        setAgentState('PROCESSING');
        setLastHeard(transcript);
        setCurrentCommand(transcript);
        setCommandHistory((prev) => [transcript, ...prev.slice(0, 9)]);

        // Process recognized command with latest reference
        setTimeout(() => {
          if (handleVoiceCommandRef.current) {
            handleVoiceCommandRef.current(transcript);
          }
        }, 50);
      },
      onError: (errorMsg, rawError) => {
        if (rawError === 'aborted' || errorMsg === 'aborted') {
          setAgentState('READY');
          setMicErrorMsg('');
          return;
        }
        if (rawError === 'no-speech' || errorMsg === 'No speech detected.') {
          setAgentState('READY');
          setMicErrorMsg('No speech detected. Please try again.');
          return;
        }
        if (rawError === 'not-allowed' || errorMsg === 'Microphone permission denied') {
          setMicErrorMsg('Microphone permission is required.');
          setAgentState('ERROR');
          return;
        }
        console.warn('SpeechRecognition error:', errorMsg);
        setMicErrorMsg(errorMsg);
        setAgentState('ERROR');
      },
      onEnd: () => {
        setAgentState((prev) => (prev === 'LISTENING' || prev === 'PROCESSING' ? 'READY' : prev));
      }
    });

    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      speechRecognitionService.stop();
      speechSynthesisService.cancel();
    };
  }, []);

  // Toggle Voice Agent ON / OFF in Settings
  const setVoiceEnabled = useCallback(
    (enabled) => {
      setVoiceEnabledState(enabled);
      try {
        if (user?.id) {
          localStorage.setItem(`beyond_barriers_voice_enabled_${user.id}`, enabled ? 'true' : 'false');
        }
        localStorage.setItem('beyond_barriers_voice_enabled', enabled ? 'true' : 'false');
      } catch (e) {}

      if (!enabled) {
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        speechSynthesisService.cancel();
        speechRecognitionService.stop();
        setAgentState('STOPPED');
        setCurrentSubtitle('');
        setCurrentCommand('');
      } else {
        setAgentState('READY');
      }
    },
    [user?.id]
  );

  // --------------------------------------------------------------------------
  // TTS SPEECH CONTROLS (Centralized Speech Synthesis - Section K, L, M, N, O)
  // --------------------------------------------------------------------------

  const speakText = useCallback(
    (text, { interrupt = true, isAcknowledgement = false } = {}) => {
      if (!text || !voiceEnabled) return;

      if (!isAcknowledgement) {
        lastSpokenContentRef.current = text;
        setLastSpokenContent(text);
      }

      speechSynthesisService.speak(text, {
        interrupt,
        rate: voiceSettings.speechRate,
        pitch: voiceSettings.speechPitch,
        volume: voiceSettings.speechVolume,
        voiceName: voiceSettings.voiceName,
        onStart: () => {
          setAgentState('SPEAKING');
        },
        onChunk: (chunk) => {
          setCurrentSubtitle(chunk);
        },
        onEnd: () => {
          setCurrentSubtitle('');
          setAgentState('READY');
        }
      });
    },
    [voiceEnabled, voiceSettings]
  );

  /**
   * STOP COMMAND: Immediately cancels speech & queued chunks (Section L, M, N, O)
   */
  const stopSpeech = useCallback(
    () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      pendingPageReadRef.current = null;
      speechSynthesisService.cancel();
      speechRecognitionService.stop();
      setCurrentSubtitle('');
      setAgentState('STOPPED');
    },
    []
  );

  /**
   * PAUSE COMMAND (Section P)
   */
  const pauseSpeech = useCallback(() => {
    speechSynthesisService.pause();
    setAgentState('PAUSED');
    setCurrentSubtitle('Speech paused.');
  }, []);

  /**
   * CONTINUE / RESUME COMMAND (Section Q)
   */
  const resumeSpeech = useCallback(() => {
    speechSynthesisService.resume();
    setAgentState('SPEAKING');
    setCurrentSubtitle('Continuing speech.');
  }, []);

  /**
   * REPEAT COMMAND (Section R)
   */
  const repeatLastSpeech = useCallback(() => {
    if (location.pathname.includes('/test')) {
      window.dispatchEvent(new CustomEvent('voice-test-command', { detail: { command: 'repeat-question' } }));
      return;
    }
    if (lastSpokenContentRef.current) {
      speakText(lastSpokenContentRef.current, { interrupt: true });
    } else {
      speakText('There is nothing to repeat.', { interrupt: true, isAcknowledgement: true });
    }
  }, [speakText, location.pathname]);

  // --------------------------------------------------------------------------
  // STT SPEECH RECOGNITION CONTROLS (MANUAL START ONLY - Section C)
  // --------------------------------------------------------------------------

  const startListening = useCallback(() => {
    if (!voiceEnabled) return;
    if (!speechRecognitionService.isSupported()) {
      setAgentState('NOT_SUPPORTED');
      setMicErrorMsg('Voice recognition is not supported in this browser.');
      return;
    }

    // Stop TTS output before opening microphone capture
    speechSynthesisService.cancel();
    setCurrentSubtitle('');

    const started = speechRecognitionService.start();
    if (started) {
      setAgentState('LISTENING');
      setMicErrorMsg('');
    }
  }, [voiceEnabled]);

  const stopListening = useCallback(() => {
    speechRecognitionService.stop();
    if (agentState === 'LISTENING') {
      setAgentState('READY');
    }
  }, [agentState]);

  // --------------------------------------------------------------------------
  // CLEAN PAGE READING ENGINE (Section I & J)
  // --------------------------------------------------------------------------

  const getVoiceReadableContent = useCallback(() => {
    if (typeof document === 'undefined') return '';

    // 1. Check data-voice-content first
    const dataEl = document.querySelector('[data-voice-content]');
    if (dataEl && dataEl.innerText && dataEl.innerText.trim().length > 5) {
      return dataEl.innerText.trim();
    }

    // 2. Check #voice-readable-content second
    const idEl = document.getElementById('voice-readable-content');
    if (idEl && idEl.innerText && idEl.innerText.trim().length > 5) {
      return idEl.innerText.trim();
    }

    // 3. Fallback: extract main content structural elements
    const mainEl = document.querySelector('main') || document.querySelector('.container') || document.body;
    const nodes = Array.from(mainEl.querySelectorAll('h1, h2, h3, h4, h5, p, li, [role="article"]'));
    const textSegments = [];

    nodes.forEach((node) => {
      if (
        node.closest('nav') || 
        node.closest('footer') || 
        node.closest('.navbar') || 
        node.closest('[aria-label*="Voice Agent"]')
      ) {
        return;
      }

      const text = node.innerText ? node.innerText.trim() : '';
      if (!text || text.length < 3) return;

      const alreadyIncluded = textSegments.some((existing) => existing.includes(text));
      if (!alreadyIncluded && !textSegments.includes(text)) {
        textSegments.push(text);
      }
    });

    const fullPageContent = textSegments.join('. ');
    return fullPageContent || 'Page content loaded.';
  }, []);

  /**
   * Helper: Wait for page content to load asynchronously after navigation (Section J)
   */
  const waitForVoiceContent = useCallback(
    (targetPath) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const check = () => {
          const el = document.querySelector('[data-voice-content], #voice-readable-content');
          if (el && el.innerText && el.innerText.trim().length > 10) {
            resolve(el.innerText.trim());
            return;
          }

          const fallback = getVoiceReadableContent();
          if (fallback && fallback.length > 20) {
            resolve(fallback);
            return;
          }

          // Timeout fallback after 2.5 seconds
          if (Date.now() - startTime > 2500) {
            resolve(fallback || 'Page content loaded.');
            return;
          }

          navTimerRef.current = setTimeout(check, 150);
        };
        check();
      });
    },
    [getVoiceReadableContent]
  );

  const registerPageSummary = useCallback(
    (path, summaryText) => {
      registeredSummariesRef.current[path] = summaryText;
    },
    []
  );

  const readCurrentPage = useCallback(() => {
    const currentPath = location.pathname;
    const summary = registeredSummariesRef.current[currentPath] || getVoiceReadableContent();
    if (summary) {
      speakText(summary, { interrupt: true });
    } else {
      speakText('Page content is loading.', { interrupt: true, isAcknowledgement: true });
    }
  }, [location.pathname, speakText, getVoiceReadableContent]);

  // --------------------------------------------------------------------------
  // COMMAND EXECUTION ROUTER (Section G & H)
  // --------------------------------------------------------------------------

  const handleVoiceCommand = useCallback(
    (rawTranscript) => {
      if (!rawTranscript || !voiceEnabledRef.current) return;

      // Single Deterministic Parser Call (Section E & F)
      const { commandTag, cleanCmd } = parseVoiceCommand(rawTranscript);

      setMatchedCommand(commandTag);
      console.log('[VoiceAgent] Heard:', rawTranscript);
      console.log('[VoiceAgent] Normalized:', cleanCmd);
      console.log('[VoiceAgent] Matched command:', commandTag);

      // 1. STOP
      if (commandTag === 'STOP') {
        stopSpeech();
        return;
      }

      // 2. STOP_LISTENING
      if (commandTag === 'STOP_LISTENING') {
        stopListening();
        speakText('Microphone stopped.', { interrupt: true, isAcknowledgement: true });
        return;
      }

      // 3. PAUSE
      if (commandTag === 'PAUSE') {
        pauseSpeech();
        return;
      }

      // 4. CONTINUE / RESUME
      if (commandTag === 'CONTINUE' || commandTag === 'RESUME') {
        resumeSpeech();
        return;
      }

      // 5. REPEAT
      if (commandTag === 'REPEAT') {
        repeatLastSpeech();
        return;
      }

      // 6. READ_PAGE
      if (commandTag === 'READ_PAGE') {
        readCurrentPage();
        return;
      }

      // 6.5 READ_RECOMMENDATIONS
      if (commandTag === 'READ_RECOMMENDATIONS') {
        window.dispatchEvent(new CustomEvent('voice-read-recommendations'));
        return;
      }

      // 7. GO_BACK
      if (commandTag === 'GO_BACK') {
        speechSynthesisService.cancel();
        speakText('Going back.', { interrupt: true, isAcknowledgement: true });
        navigate(-1);
        return;
      }

      // 8. TEST TAKING COMMANDS
      if (commandTag.startsWith('SELECT_OPTION_')) {
        const option = commandTag.replace('SELECT_OPTION_', '');
        window.dispatchEvent(new CustomEvent('voice-test-command', { detail: { option, commandTag } }));
        return;
      }

      if (commandTag === 'CONFIDENCE_SURE') {
        window.dispatchEvent(new CustomEvent('voice-test-command', { detail: { confidence: 'Sure', commandTag } }));
        return;
      }

      if (commandTag === 'CONFIDENCE_GUESSING') {
        window.dispatchEvent(new CustomEvent('voice-test-command', { detail: { confidence: 'Guessing', commandTag } }));
        return;
      }

      if (commandTag === 'SUBMIT_TEST') {
        window.dispatchEvent(new CustomEvent('voice-test-command', { detail: { command: 'submit', commandTag } }));
        speakText('Submitting test attempt.', { interrupt: true, isAcknowledgement: true });
        return;
      }

      // Helper for Page Navigation Commands (Section G & H)
      const handleNavCommand = (targetPath, ackText) => {
        speechSynthesisService.cancel();
        speakText(ackText, { interrupt: true, isAcknowledgement: true });
        navigate(targetPath);

        // Wait for page destination content to mount before reading content (Section H & J)
        waitForVoiceContent(targetPath).then((content) => {
          if (content) {
            speakText(content, { interrupt: false });
          }
        });
      };

      if (commandTag === 'GO_DASHBOARD') {
        handleNavCommand('/student/dashboard', 'Opening Dashboard.');
        return;
      }

      if (commandTag === 'GO_MY_LEARNING') {
        handleNavCommand('/student/learning', 'Opening My Learning.');
        return;
      }

      if (commandTag === 'EXPLAIN_LESSON') {
        handleNavCommand('/student/learning/module/1', 'Opening Lesson 1 explanation.');
        return;
      }

      if (commandTag === 'START_TEST') {
        const testMatch = location.pathname.match(/\/student\/learning\/module\/(\d+)/);
        const modId = testMatch ? testMatch[1] : '1';
        handleNavCommand(`/student/learning/module/${modId}/test`, 'Starting the test.');
        return;
      }

      if (commandTag === 'GO_ATTENDANCE') {
        handleNavCommand('/student/attendance', 'Opening Attendance and Marks.');
        return;
      }

      if (commandTag === 'GO_SCHOLARSHIPS') {
        handleNavCommand('/student/scholarships', 'Opening Scholarships.');
        return;
      }

      if (commandTag === 'GO_RESOURCES') {
        handleNavCommand('/student/resources', 'Opening Educational Resources.');
        return;
      }

      if (commandTag === 'GO_CAREER') {
        handleNavCommand('/student/career', 'Opening Career Guidance.');
        return;
      }

      if (commandTag === 'GO_ACCESSIBILITY') {
        handleNavCommand('/student/accessibility', 'Opening Accessibility Settings.');
        return;
      }

      if (commandTag === 'GO_PROFILE') {
        handleNavCommand('/student/profile', 'Opening Profile.');
        return;
      }

      // Unrecognized command feedback
      speakText(`Command not recognized: "${rawTranscript}". Try saying Go to Dashboard, Read the page, or Stop.`, {
        interrupt: true,
        isAcknowledgement: true
      });
    },
    [
      stopSpeech,
      stopListening,
      pauseSpeech,
      resumeSpeech,
      repeatLastSpeech,
      readCurrentPage,
      speakText,
      navigate,
      waitForVoiceContent,
      location.pathname
    ]
  );

  // Keep handleVoiceCommandRef synchronized on every render
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  const executeCommand = useCallback(
    (commandPhrase) => {
      if (!voiceEnabledRef.current) return;
      setLastHeard(commandPhrase);
      setCurrentCommand(commandPhrase);
      setCommandHistory((prev) => [commandPhrase, ...prev.slice(0, 9)]);
      if (handleVoiceCommandRef.current) {
        handleVoiceCommandRef.current(commandPhrase);
      }
    },
    []
  );

  const updateVoiceSettings = useCallback((newSettings) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof document !== 'undefined') {
        const root = document.documentElement;

        if (updated.highContrast) {
          root.classList.add('high-contrast');
        } else {
          root.classList.remove('high-contrast');
        }

        if (updated.dyslexicFont) {
          root.classList.add('dyslexic-font');
        } else {
          root.classList.remove('dyslexic-font');
        }

        root.setAttribute('data-font-scale', updated.fontScale || '100%');
        root.setAttribute('data-colorblind', updated.colorblindMode || 'none');
      }
      return updated;
    });
  }, []);

  const value = {
    isStudentRole,
    isVisualStudent,
    isVoiceEligible,
    voiceEnabled,
    setVoiceEnabled,
    agentState,
    lastHeard,
    matchedCommand,
    currentCommand,
    lastSpokenContent,
    currentSubtitle,
    micErrorMsg,
    commandHistory,
    voiceSettings,
    availableVoices,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    repeatLastSpeech,
    startListening,
    stopListening,
    registerPageSummary,
    readCurrentPage,
    getVoiceReadableContent,
    executeCommand,
    updateVoiceSettings,
    parseVoiceCommand
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoiceAgent = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceAgent must be used within a VoiceProvider');
  }
  return context;
};

export default VoiceContext;
