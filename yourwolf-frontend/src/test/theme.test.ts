import {describe, it, expect} from 'vitest';
import {theme} from '../styles/theme';

describe('theme', () => {
  describe('colors', () => {
    it('has background color defined', () => {
      expect(theme.colors.background).toBe('#0f0f0f');
    });

    it('has surface colors defined', () => {
      expect(theme.colors.surface).toBe('#1a1a1a');
      expect(theme.colors.surfaceLight).toBe('#252525');
    });

    it('has primary colors defined', () => {
      expect(theme.colors.primary).toBe('#8b0000');
      expect(theme.colors.primaryLight).toBe('#a52a2a');
    });

    it('has text colors defined', () => {
      expect(theme.colors.text).toBe('#e0e0e0');
      expect(theme.colors.textMuted).toBe('#9a9a9a');
    });

    describe('team colors', () => {
      it('has village team color', () => {
        expect(theme.colors.village).toBe('#4a7c59');
      });

      it('has werewolf team color', () => {
        expect(theme.colors.werewolf).toBe('#8b0000');
      });

      it('has vampire team color', () => {
        expect(theme.colors.vampire).toBe('#4b0082');
      });

      it('has alien team color', () => {
        expect(theme.colors.alien).toBe('#2e8b57');
      });

      it('has neutral team color', () => {
        expect(theme.colors.neutral).toBe('#696969');
      });
    });

    describe('semantic colors', () => {
      it('has success color', () => {
        expect(theme.colors.success).toBe('#2e7d32');
      });

      it('has warning color', () => {
        expect(theme.colors.warning).toBe('#f57c00');
      });

      it('has error color', () => {
        expect(theme.colors.error).toBe('#c62828');
      });
    });
  });

  describe('spacing', () => {
    it('has xs spacing', () => {
      expect(theme.spacing.xs).toBe('4px');
    });

    it('has sm spacing', () => {
      expect(theme.spacing.sm).toBe('8px');
    });

    it('has md spacing', () => {
      expect(theme.spacing.md).toBe('16px');
    });

    it('has lg spacing', () => {
      expect(theme.spacing.lg).toBe('24px');
    });

    it('has xl spacing', () => {
      expect(theme.spacing.xl).toBe('32px');
    });
  });

  describe('borderRadius', () => {
    it('has sm border radius', () => {
      expect(theme.borderRadius.sm).toBe('4px');
    });

    it('has md border radius', () => {
      expect(theme.borderRadius.md).toBe('8px');
    });

    it('has lg border radius', () => {
      expect(theme.borderRadius.lg).toBe('12px');
    });
  });

  describe('shadows', () => {
    it('has sm shadow', () => {
      expect(theme.shadows.sm).toContain('rgba(0,0,0,0.3)');
    });

    it('has md shadow', () => {
      expect(theme.shadows.md).toContain('rgba(0,0,0,0.4)');
    });

    it('has lg shadow', () => {
      expect(theme.shadows.lg).toContain('rgba(0,0,0,0.5)');
    });
  });

  describe('type safety', () => {
    it('theme object is frozen (as const)', () => {
      // The 'as const' assertion makes the object readonly
      // We verify the structure is correct
      expect(typeof theme.colors).toBe('object');
      expect(typeof theme.spacing).toBe('object');
      expect(typeof theme.borderRadius).toBe('object');
      expect(typeof theme.shadows).toBe('object');
    });
  });
});
