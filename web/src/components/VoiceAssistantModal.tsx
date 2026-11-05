// ============================================================
// d:\ABHAYA\web\src\components\VoiceAssistantModal.tsx
// Voice Command Safety Assistant (Web Speech Recognition & Synthesis)
// Supports both English and Hindi Voice Commands
// ============================================================

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Navigation, AlertTriangle, Users, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onTriggerSOS: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerSOS,
}) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setFeedback(language === 'hi' ? 'बोलिए, मैं सुन रही हूँ...' : 'Listening, please speak...');
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          setFeedback('Microphone ready. Tap button to speak or click quick command below.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, [language]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionInstance) {
      try {
        setTranscript('');
        recognitionInstance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionInstance.start();
      } catch (e) {
        recognitionInstance.stop();
        setTimeout(() => recognitionInstance.start(), 200);
      }
    } else {
      setFeedback('Speech recognition not available on this browser. Try quick voice action buttons below.');
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsListening(false);
  };

  // Process text command
  const executeCommand = (cmdText: string) => {
    const text = cmdText.toLowerCase();

    // 1. Safe Route Command
    if (text.includes('route') || text.includes('रास्ता') || text.includes('मार्ग') || text.includes('vikaspuri')) {
      const reply = language === 'hi' ? 'विकासपुरी के लिए सुरक्षित मार्ग खोला जा रहा है।' : 'Calculating safe route to Vikaspuri.';
      setFeedback(reply);
      speakResponse(reply);
      setTimeout(() => {
        onNavigateTab('routes');
        onClose();
      }, 1200);
      return;
    }

    // 2. Journey Sharing Command
    if (text.includes('journey') || text.includes('यात्रा') || text.includes('share') || text.includes('शेयर')) {
      const reply = language === 'hi' ? 'लाइव यात्रा शेयरिंग स्क्रीन खोली जा रही है।' : 'Opening live journey sharing.';
      setFeedback(reply);
      speakResponse(reply);
      setTimeout(() => {
        onNavigateTab('journey');
        onClose();
      }, 1200);
      return;
    }

    // 3. Emergency SOS Command
    if (text.includes('sos') || text.includes('emergency') || text.includes('मदद') || text.includes('आपातकाल') || text.includes('बचाओ')) {
      const reply = language === 'hi' ? 'आपातकालीन एसओएस सक्रिय किया जा रहा है!' : 'Activating Emergency SOS!';
      setFeedback(reply);
      speakResponse(reply);
      setTimeout(() => {
        onTriggerSOS();
        onClose();
      }, 1000);
      return;
    }

    // 4. Police / Hospital Command
    if (text.includes('police') || text.includes('पुलिस') || text.includes('hospital') || text.includes('अस्पताल') || text.includes('help')) {
      const reply = language === 'hi' ? 'निकटतम पुलिस स्टेशन और अस्पताल दिखाए जा रहे हैं।' : 'Showing nearby police stations and hospitals.';
      setFeedback(reply);
      speakResponse(reply);
      setTimeout(() => {
        onNavigateTab('nearby');
        onClose();
      }, 1200);
      return;
    }

    // 5. Community Command
    if (text.includes('community') || text.includes('कम्युनिटी') || text.includes('report')) {
      const reply = language === 'hi' ? 'कम्युनिटी सुरक्षा नेटवर्क खोला जा रहा है।' : 'Opening community safety network.';
      setFeedback(reply);
      speakResponse(reply);
      setTimeout(() => {
        onNavigateTab('community');
        onClose();
      }, 1200);
      return;
    }

    setFeedback(language === 'hi' ? 'क्षमा करें, आदेश समझ नहीं आया। नीचे दिए गए बटनों को आज़माएँ।' : 'Command not recognized. Tap a quick command below.');
  };

  useEffect(() => {
    if (transcript.trim().length > 3 && !isListening) {
      executeCommand(transcript);
    }
  }, [transcript, isListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-purple-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#673AB7] to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E8A0BF]" />
            <h3 className="font-extrabold text-lg">{t('voiceAssistant')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          
          {/* Animated Microphone Button */}
          <div className="relative my-4">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-[#673AB7] animate-ping opacity-30"></div>
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                isListening
                  ? 'bg-red-500 scale-105 shadow-red-500/40'
                  : 'bg-[#673AB7] hover:bg-purple-700 shadow-[#673AB7]/30'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 animate-bounce" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-[#673AB7] mt-2">
            {isListening ? t('voiceListening') : t('voicePrompt')}
          </p>

          {/* Transcript Display */}
          <div className="w-full mt-4 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 min-h-[58px] flex items-center justify-center">
            <p className="text-sm font-semibold text-[#292936]">
              {transcript ? `"${transcript}"` : feedback || t('voiceExamples')}
            </p>
          </div>

          {/* Quick Voice Command Pills */}
          <div className="w-full mt-6 text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Tap to Test Voice Command:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setTranscript('Find safe route to Vikaspuri');
                  executeCommand('Find safe route to Vikaspuri');
                }}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-[#673AB7] hover:bg-purple-50 text-xs font-medium text-gray-800 text-left flex items-center justify-between"
              >
                <span>"Find safe route to Vikaspuri"</span>
                <Navigation className="w-3.5 h-3.5 text-[#673AB7]" />
              </button>

              <button
                onClick={() => {
                  setTranscript('Meri journey share karo');
                  executeCommand('Meri journey share karo');
                }}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-[#673AB7] hover:bg-purple-50 text-xs font-medium text-gray-800 text-left flex items-center justify-between"
              >
                <span>"Meri journey share karo" (हिंदी)</span>
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              </button>

              <button
                onClick={() => {
                  setTranscript('Emergency SOS activate karo');
                  executeCommand('Emergency SOS activate karo');
                }}
                className="p-2.5 rounded-xl border border-red-200 hover:border-red-500 hover:bg-red-50 text-xs font-bold text-red-700 text-left flex items-center justify-between"
              >
                <span>"Emergency SOS activate karo"</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </button>

              <button
                onClick={() => {
                  setTranscript('Show nearby police stations');
                  executeCommand('Show nearby police stations');
                }}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-[#673AB7] hover:bg-purple-50 text-xs font-medium text-gray-800 text-left flex items-center justify-between"
              >
                <span>"Show nearby police stations"</span>
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
