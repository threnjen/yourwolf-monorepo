import {STRING_TARGET_OPTIONS} from '../../../domain/constants';
import {theme} from '../../../styles/theme';
import {selectStyles} from '../../../styles/shared';

const paramRowStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  paddingTop: theme.spacing.sm,
  width: '100%',
};

const paramFieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.xs,
};

const paramLabelStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.75rem',
};

export interface StepParameterInputsProps {
  /** Position of the owning step; namespaces input ids so sibling steps do not collide. */
  stepIndex: number;
  /** JSON-Schema-ish descriptor for the owning ability's parameters. */
  schema: Record<string, unknown>;
  /** Current parameter values for the owning step. */
  values: Record<string, unknown>;
  /** Reports a raw, uncoerced input value. Coercion is the caller's job (domain/abilitySteps). */
  onChange: (key: string, value: unknown) => void;
}

/**
 * Renders the input for one ability parameter, driven by its schema type.
 *
 * Reports raw input values — coercion belongs to `domain/abilitySteps.setStepParameter`,
 * so this component stays presentational.
 */
export function StepParameterInputs({stepIndex, schema, values, onChange}: StepParameterInputsProps) {
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!properties || Object.keys(properties).length === 0) return null;

  const required = (schema.required as string[] | undefined) ?? [];

  return (
    <div style={paramRowStyles}>
      {Object.entries(properties).map(([key, prop]) => {
        const isRequired = required.includes(key);
        const label = `${key} ${isRequired ? '*' : '(optional)'}`;
        const inputId = `param-${stepIndex}-${key}`;
        const type = prop.type as string;

        let inputEl: React.ReactNode;
        if (type === 'string' && prop.enum) {
          const enumValues = prop.enum as string[];
          inputEl = (
            <select
              id={inputId}
              style={selectStyles}
              value={(values[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">—</option>
              {enumValues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          );
        } else if (type === 'string') {
          inputEl = (
            <select
              id={inputId}
              style={selectStyles}
              value={(values[key] as string) ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">—</option>
              {STRING_TARGET_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          );
        } else if (type === 'integer') {
          inputEl = (
            <input
              id={inputId}
              type="number"
              min={1}
              style={selectStyles}
              value={(values[key] as number) ?? (prop.default as number) ?? 1}
              onChange={(e) => onChange(key, e.target.value)}
            />
          );
        } else if (type === 'array') {
          const arrVal = values[key] as number[] | undefined;
          inputEl = (
            <input
              id={inputId}
              type="text"
              style={selectStyles}
              value={arrVal ? arrVal.join(', ') : ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          );
        } else {
          return null;
        }

        return (
          <div key={key} style={paramFieldStyles}>
            <label htmlFor={inputId} style={paramLabelStyles}>{label}</label>
            {inputEl}
          </div>
        );
      })}
    </div>
  );
}
