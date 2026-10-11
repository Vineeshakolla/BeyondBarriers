/**
 * Web Speech API - SpeechRecognition (STT) Service Wrapper
 * Provides browser-native speech-to-text functionality.
 */

export class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onStartCallback = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
  }

  isSupported() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  init({ onStart, onResult, onError, onEnd }) {
    if (!this.isSupported()) {
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Single command mode for privacy & manual control
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.onStartCallback = onStart;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStartCallback) this.onStartCallback();
    };

    this.recognition.onresult = (event) => {
      this.isListening = false;
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.trim();
      if (this.onResultCallback) this.onResultCallback(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      const errType = event.error;

      // 'aborted' occurs normally when recognition is stopped or restarted. Do NOT treat as hard failure.
      if (errType === 'aborted') {
        if (this.onEndCallback) this.onEndCallback();
        return;
      }

      let errorMsg = errType;
      if (errType === 'not-allowed') {
        errorMsg = 'Microphone access blocked. Grant permission in browser settings.';
      } else if (errType === 'no-speech') {
        errorMsg = 'No speech detected.';
      }

      if (this.onErrorCallback) this.onErrorCallback(errorMsg, errType);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) this.onEndCallback();
    };

    return true;
  }

  start() {
    if (!this.recognition) return false;
    try {
      if (this.isListening) {
        this.recognition.stop();
      }
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      try {
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
            this.isListening = true;
          } catch (err) {}
        }, 50);
        return true;
      } catch (err) {
        console.warn('SpeechRecognition start warning:', err);
        return false;
      }
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // Ignored if already stopped
    }
    this.isListening = false;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
export default speechRecognitionService;
