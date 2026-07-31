import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('combines regular class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('resolves Tailwind conflicts correctly', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });

  it('handles edge cases', () => {
    expect(cn('class1', null, undefined, ['class2', 'class3'], { class4: true, class5: false })).toBe('class1 class2 class3 class4');
  });
});
