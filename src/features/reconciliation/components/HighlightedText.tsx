import React from 'react';
import { cleanName } from '../search-engine';

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export function computeHighlightSegments(
  candidateText: string,
  referenceText: string
): HighlightSegment[] {
  if (!candidateText || !referenceText) return [{ text: candidateText, isMatch: false }];

  const cleanedReference = cleanName(referenceText);
  const tokens = cleanedReference.split(/\s+/).filter(t => t.length >= 3);
  
  if (tokens.length === 0) return [{ text: candidateText, isMatch: false }];

  const ranges: [number, number][] = [];
  const candidateLower = candidateText.toLowerCase();

  for (const token of tokens) {
    const tokenLower = token.toLowerCase();
    let startIndex = 0;
    while ((startIndex = candidateLower.indexOf(tokenLower, startIndex)) > -1) {
      ranges.push([startIndex, startIndex + token.length]);
      startIndex += token.length;
    }
  }

  if (ranges.length === 0) return [{ text: candidateText, isMatch: false }];

  // Merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const mergedRanges: [number, number][] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const current = ranges[i];
    const lastMerged = mergedRanges[mergedRanges.length - 1];

    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      mergedRanges.push(current);
    }
  }

  const segments: HighlightSegment[] = [];
  let currentIndex = 0;

  for (const [start, end] of mergedRanges) {
    if (start > currentIndex) {
      segments.push({ text: candidateText.slice(currentIndex, start), isMatch: false });
    }
    segments.push({ text: candidateText.slice(start, end), isMatch: true });
    currentIndex = end;
  }

  if (currentIndex < candidateText.length) {
    segments.push({ text: candidateText.slice(currentIndex), isMatch: false });
  }

  return segments;
}

export interface HighlightedTextProps {
  candidateText: string;
  referenceText: string;
  matchClass?: string;
  mismatchClass?: string;
  mode: 'partial' | 'exact';
}

export function HighlightedText({
  candidateText,
  referenceText,
  matchClass = 'text-emerald-600 font-bold',
  mismatchClass = 'text-red-500',
  mode,
}: HighlightedTextProps) {
  if (mode === 'exact') {
    const isMatch = candidateText.toUpperCase().includes(referenceText.toUpperCase()) || 
                    referenceText.toUpperCase().includes(candidateText.toUpperCase());
    
    return (
      <span className={isMatch ? matchClass : mismatchClass}>
        {candidateText}
      </span>
    );
  }

  const segments = computeHighlightSegments(candidateText, referenceText);

  return (
    <span>
      {segments.map((seg, i) => 
        seg.isMatch ? (
          <mark key={i} className={`bg-transparent ${matchClass}`}>
            {seg.text}
          </mark>
        ) : (
          <span key={i} className="text-foreground">{seg.text}</span>
        )
      )}
    </span>
  );
}
