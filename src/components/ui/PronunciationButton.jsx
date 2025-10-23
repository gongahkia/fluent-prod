/**
 * PronunciationButton Component
 * Reusable button for text-to-speech pronunciation
 * Uses Web Speech API via pronunciationService
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import pronunciationService from '@/services/pronunciationService';

export function PronunciationButton({
  text,
  language = 'English',
  variant = 'ghost',
  size = 'sm',
  className,
  showLabel = false,
  label = '',
  disabled = false,
  ...props
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(false);

  const handleSpeak = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers

    // If already speaking, stop instead
    if (isSpeaking) {
      pronunciationService.stop();
      setIsSpeaking(false);
      return;
    }

    // Reset error state
    setError(false);

    // Check if text is provided
    if (!text || text.trim() === '') {
      console.warn('No text provided for pronunciation');
      return;
    }

    // Check browser support
    if (!pronunciationService.isSpeechSynthesisSupported()) {
      console.error('Speech synthesis not supported in this browser');
      setError(true);
      return;
    }

    try {
      setIsSpeaking(true);
      await pronunciationService.speak(text, language, {
        onStart: () => {
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
        },
        onError: (err) => {
          console.error('Pronunciation error:', err);
          setError(true);
          setIsSpeaking(false);
        },
      });
    } catch (err) {
      console.error('Error during pronunciation:', err);
      setError(true);
      setIsSpeaking(false);
    }
  };

  // Determine which icon to show
  const Icon = error ? VolumeX : isSpeaking ? Loader2 : Volume2;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSpeak}
      disabled={disabled || !text || text.trim() === ''}
      className={cn(
        'transition-all',
        isSpeaking && 'text-primary',
        error && 'text-destructive',
        className
      )}
      title={
        error
          ? 'Pronunciation not available'
          : isSpeaking
            ? 'Stop pronunciation'
            : 'Pronounce'
      }
      {...props}
    >
      <Icon
        className={cn('size-4', isSpeaking && 'animate-spin')}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="ml-1">{label || (isSpeaking ? 'Speaking...' : 'Speak')}</span>
      )}
    </Button>
  );
}

/**
 * Compact pronunciation icon button (icon only, smaller)
 */
export function PronunciationIcon({
  text,
  language = 'English',
  className,
  disabled = false,
}) {
  return (
    <PronunciationButton
      text={text}
      language={language}
      variant="ghost"
      size="icon"
      className={cn('size-8', className)}
      disabled={disabled}
    />
  );
}

export default PronunciationButton;
