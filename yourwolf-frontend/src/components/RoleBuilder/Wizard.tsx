import {useState} from 'react';
import {RoleDraft, ValidationResult} from '../../types/role';
import {theme} from '../../styles/theme';
import {BasicInfoStep} from './steps/BasicInfoStep';
import {AbilitiesStep} from './steps/AbilitiesStep';
import {WinConditionsStep} from './steps/WinConditionsStep';
import {ReviewStep} from './steps/ReviewStep';

type WizardStep = 'basic' | 'abilities' | 'win' | 'review';

const STEPS: {id: WizardStep; label: string}[] = [
  {id: 'basic', label: 'Basic Info'},
  {id: 'abilities', label: 'Abilities'},
  {id: 'win', label: 'Win Conditions'},
  {id: 'review', label: 'Review'},
];

interface WizardProps {
  draft: RoleDraft;
  validation: ValidationResult | null;
  onChange: (draft: RoleDraft) => void;
  onSave: () => void;
  saving: boolean;
}

const containerStyles: React.CSSProperties = {
  width: '100%',
};

const stepIndicatorStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.sm,
  marginBottom: theme.spacing.xl,
  borderBottom: `1px solid ${theme.colors.secondary}`,
  paddingBottom: theme.spacing.md,
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing.xl,
  paddingTop: theme.spacing.md,
  borderTop: `1px solid ${theme.colors.secondary}`,
};

const buttonBaseStyles: React.CSSProperties = {
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  borderRadius: theme.borderRadius.md,
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 500,
};

function getStepIndicatorItemStyles(isActive: boolean, isCompleted: boolean): React.CSSProperties {
  return {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.sm,
    cursor: isCompleted || isActive ? 'pointer' : 'default',
    fontWeight: isActive ? 700 : 400,
    color: isActive ? theme.colors.text : isCompleted ? theme.colors.primaryLight : theme.colors.textMuted,
    backgroundColor: isActive ? theme.colors.surfaceLight : 'transparent',
    border: 'none',
    fontSize: '0.9rem',
    borderBottom: isActive ? `2px solid ${theme.colors.primaryLight}` : '2px solid transparent',
  };
}

function getPrimaryButtonStyles(disabled: boolean): React.CSSProperties {
  return {
    ...buttonBaseStyles,
    backgroundColor: disabled ? theme.colors.secondary : theme.colors.primary,
    color: disabled ? theme.colors.textMuted : theme.colors.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function getSecondaryButtonStyles(disabled: boolean): React.CSSProperties {
  return {
    ...buttonBaseStyles,
    backgroundColor: 'transparent',
    color: disabled ? theme.colors.textMuted : theme.colors.text,
    border: `1px solid ${disabled ? theme.colors.secondary : theme.colors.textMuted}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

function canProceedFromStep(step: WizardStep, draft: RoleDraft): boolean {
  if (step === 'basic') {
    return draft.name.trim().length >= 2;
  }
  return true;
}

export function Wizard({draft, validation, onChange, onSave, saving}: WizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;
  const canProceed = canProceedFromStep(currentStep, draft);

  function handleNext() {
    if (!isLastStep && canProceed) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  }

  function handleBack() {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }

  function handleStepClick(stepIndex: number) {
    if (stepIndex < currentIndex) {
      setCurrentStep(STEPS[stepIndex].id);
    }
  }

  return (
    <div style={containerStyles}>
      <div style={stepIndicatorStyles}>
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          return (
            <button
              key={step.id}
              style={getStepIndicatorItemStyles(isActive, isCompleted)}
              onClick={() => handleStepClick(index)}
              disabled={!isCompleted && !isActive}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      <div>
        {currentStep === 'basic' && (
          <BasicInfoStep draft={draft} onChange={onChange} />
        )}
        {currentStep === 'abilities' && (
          <AbilitiesStep draft={draft} onChange={onChange} />
        )}
        {currentStep === 'win' && (
          <WinConditionsStep draft={draft} onChange={onChange} />
        )}
        {currentStep === 'review' && (
          <ReviewStep draft={draft} validation={validation} />
        )}
      </div>

      <div style={navStyles}>
        <button
          style={getSecondaryButtonStyles(isFirstStep)}
          onClick={handleBack}
          disabled={isFirstStep}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            style={getPrimaryButtonStyles(saving || !validation?.is_valid)}
            onClick={onSave}
            disabled={saving || !validation?.is_valid}
          >
            {saving ? 'Saving...' : 'Create Role'}
          </button>
        ) : (
          <button
            style={getPrimaryButtonStyles(!canProceed)}
            onClick={handleNext}
            disabled={!canProceed}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
