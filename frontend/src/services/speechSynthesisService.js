/**
 * Web Speech API - SpeechSynthesis (TTS) Service Wrapper
 * Provides browser-native text-to-speech with sentence chunking, queueing, pause, resume, cancel,
 * and a robust speechGeneration token system to guarantee immediate and permanent stop.
 */

export class SpeechSynthesisService {
  constructor() {
    this.queue = [];
    this.isSpeaking = false;
    this.isPaused = false;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onChunkCallback = null;
    this.currentUtterance = null;
    this.speechGeneration = 0;
  }

  isSupported() {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  getVoices() {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  splitIntoChunks(text) {
    if (!text) return [];
    // Split text cleanly by sentence-ending punctuation or newlines
    const rawChunks = text.split(/(?<=[.?!])\s+|\n+/);
    return rawChunks.map((c) => c.trim()).filter((c) => c.length > 0);
  }

  speak(text, options = {}) {
    if (!this.isSupported() || !text) return;

    const {
      interrupt = true,
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      voiceName = '',
      onStart,
      onEnd,
      onChunk
    } = options;

    if (interrupt) {
      this.cancel();
    }

    const chunks = this.splitIntoChunks(text);
    if (chunks.length === 0) return;

    // Increment speech generation token for this new speech session
    this.speechGeneration++;
    const currentGen = this.speechGeneration;

    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;
    this.onChunkCallback = onChunk;

    this.queue.push(...chunks.map(chunk => ({
      text: chunk,
      rate,
      pitch,
      volume,
      voiceName,
      generation: currentGen
    })));

    if (!this.isSpeaking || interrupt) {
      if (this.onStartCallback) this.onStartCallback(currentGen);
      this.processQueue(currentGen);
    }
  }

  processQueue(expectedGen) {
    if (!this.isSupported()) return;

    // Speech generation token validation
    if (expectedGen && expectedGen !== this.speechGeneration) {
      return;
    }

    if (this.queue.length === 0) {
      this.isSpeaking = false;
      this.isPaused = false;
      if (this.onEndCallback) this.onEndCallback(this.speechGeneration);
      return;
    }

    const item = this.queue.shift();

    // Verify token again before speaking chunk
    if (item.generation !== this.speechGeneration) {
      return;
    }

    this.isSpeaking = true;
    this.isPaused = false;

    if (this.onChunkCallback) {
      this.onChunkCallback(item.text, item.generation);
    }

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = item.rate || 1.0;
    utterance.pitch = item.pitch || 1.0;
    utterance.volume = item.volume || 1.0;

    if (item.voiceName) {
      const voices = this.getVoices();
      const match = voices.find(v => v.name === item.voiceName);
      if (match) utterance.voice = match;
    }

    const currentGen = item.generation;

    utterance.onend = () => {
      this.currentUtterance = null;
      if (currentGen !== this.speechGeneration) return;
      this.processQueue(currentGen);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesisUtterance error:', e);
      this.currentUtterance = null;
      if (currentGen !== this.speechGeneration) return;
      this.processQueue(currentGen);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    if (!this.isSupported()) return;
    // Invalidate all pending or queued speech by bumping the generation token
    this.speechGeneration++;
    window.speechSynthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onChunkCallback = null;
  }

  pause() {
    if (!this.isSupported()) return;
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (!this.isSupported()) return;
    if (this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }
}

export const speechSynthesisService = new SpeechSynthesisService();
export default speechSynthesisService;
