import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

interface DictationControlProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Web Speech API — not in lib.dom.d.ts by default; declare minimally what we use
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult;
  length: number;
}

interface ISpeechRecognitionResult {
  [index: number]: { transcript: string };
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export default function DictationControl({ onTranscript, disabled }: DictationControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!isSupported) return null;  // Graceful degradation — hide if browser unsupported

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition!;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const transcript = Array.from(
        { length: event.results.length - event.resultIndex },
        (_, i) => event.results[event.resultIndex + i],
      )
        .map(r => r[0].transcript)
        .join(' ');
      onTranscript(transcript.trim());
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        color={isListening ? 'error' : 'primary'}
        aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
        size="large"
      >
        {isListening ? <StopIcon /> : <MicIcon />}
      </IconButton>

      {isListening && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Waveform indicator: 3 animated bars */}
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 4,
                height: 16 + i * 8,
                bgcolor: 'error.main',
                borderRadius: 1,
                animation: 'pulse 0.8s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scaleY(0.5)', opacity: 0.5 },
                  '50%': { transform: 'scaleY(1)', opacity: 1 },
                },
              }}
            />
          ))}
          <Typography variant="caption" color="error">Listening…</Typography>
        </Box>
      )}

    </Box>
  );
}
