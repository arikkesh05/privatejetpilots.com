import React, { useMemo } from 'react';

interface SplitFlapTextProps {
  text: string;
  className?: string;
  flapClassName?: string;
  accentWords?: string[];
}

export const SplitFlapText: React.FC<SplitFlapTextProps> = ({
  text,
  className = '',
  flapClassName = 'js-flap-word',
  accentWords = [],
}) => {
  const words = useMemo(() => text.split(' '), [text]);

  return (
    <span className={`inline-block leading-[1.15] select-none ${className}`}>
      {words.map((word, i) => {
        // Strip punctuation to accurately match accent words (e.g. "precision." -> "precision")
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
        const isAccent = accentWords.some(
          (acc) => acc.toLowerCase() === cleanWord.toLowerCase()
        );

        return (
          <span
            key={`${word}-${i}`}
            className="inline-block mr-[0.3em] overflow-hidden align-top"
            style={{ perspective: '1200px' }}
          >
            <span
              className={`${flapClassName} inline-block will-change-transform`}
              data-accent={isAccent ? 'true' : 'false'}
              style={{
                transformOrigin: '50% 0%',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default SplitFlapText;