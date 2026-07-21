import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {StepParameterInputs} from '../../../../components/RoleBuilder/steps/StepParameterInputs';

/**
 * Unit tests for the schema-driven parameter form, exercised in isolation.
 *
 * Every input kind the form can render is covered here: enum select, free-string
 * select backed by STRING_TARGET_OPTIONS, integer number input, comma-separated
 * array text input, and the unknown/empty-schema no-render paths.
 */
describe('StepParameterInputs', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const enumSchema = {
    type: 'object',
    properties: {
      team: {type: 'string', enum: ['village', 'werewolf', 'vampire', 'alien', 'neutral']},
    },
    required: ['team'],
  };

  const viewCardSchema = {
    type: 'object',
    properties: {
      target: {type: 'string', description: 'Target card location'},
      count: {type: 'integer', default: 1, description: 'Number of cards'},
    },
    required: ['target'],
  };

  const arraySchema = {
    type: 'object',
    properties: {
      options: {type: 'array', items: {type: 'integer'}},
    },
    required: ['options'],
  };

  describe('no-render paths', () => {
    it('renders nothing when schema has no properties key', () => {
      const {container} = render(
        <StepParameterInputs stepIndex={0} schema={{}} values={{}} onChange={onChange} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when properties is empty', () => {
      const {container} = render(
        <StepParameterInputs
          stepIndex={0}
          schema={{type: 'object', properties: {}}}
          values={{}}
          onChange={onChange}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('skips properties with an unknown type', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={{type: 'object', properties: {weird: {type: 'boolean'}}}}
          values={{}}
          onChange={onChange}
        />,
      );
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('enum string parameter', () => {
    it('renders a select containing every enum option plus the empty placeholder', () => {
      render(
        <StepParameterInputs stepIndex={0} schema={enumSchema} values={{}} onChange={onChange} />,
      );
      expect(screen.getByRole('option', {name: 'village'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'werewolf'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'vampire'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'alien'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'neutral'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: '—'})).toBeInTheDocument();
    });

    it('reflects the current value', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={enumSchema}
          values={{team: 'alien'}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('combobox', {name: /team \*/i})).toHaveValue('alien');
    });

    it('emits the raw selected value through onChange', () => {
      render(
        <StepParameterInputs stepIndex={0} schema={enumSchema} values={{}} onChange={onChange} />,
      );
      fireEvent.change(screen.getByRole('combobox', {name: /team \*/i}), {
        target: {value: 'werewolf'},
      });
      expect(onChange).toHaveBeenCalledWith('team', 'werewolf');
    });
  });

  describe('free string parameter', () => {
    it('renders a select backed by STRING_TARGET_OPTIONS', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={viewCardSchema}
          values={{count: 1}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('option', {name: 'player.self'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'player.other'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'center.main'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'center.bonus'})).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'players.actions'})).toBeInTheDocument();
    });

    it('emits the raw selected value through onChange', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={viewCardSchema}
          values={{count: 1}}
          onChange={onChange}
        />,
      );
      fireEvent.change(screen.getByRole('combobox', {name: /target \*/i}), {
        target: {value: 'center.main'},
      });
      expect(onChange).toHaveBeenCalledWith('target', 'center.main');
    });
  });

  describe('integer parameter', () => {
    it('renders a number input with min 1', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={viewCardSchema}
          values={{count: 3}}
          onChange={onChange}
        />,
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(3);
      expect(input).toHaveAttribute('min', '1');
    });

    it('falls back to the schema default when the value is absent', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={{
            type: 'object',
            properties: {count: {type: 'integer', default: 4}},
          }}
          values={{}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('spinbutton')).toHaveValue(4);
    });

    it('falls back to 1 when neither value nor schema default exists', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={{type: 'object', properties: {count: {type: 'integer'}}}}
          values={{}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('spinbutton')).toHaveValue(1);
    });

    it('emits the raw string input through onChange, leaving coercion to the caller', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={viewCardSchema}
          values={{count: 1}}
          onChange={onChange}
        />,
      );
      fireEvent.change(screen.getByRole('spinbutton'), {target: {value: '7'}});
      expect(onChange).toHaveBeenCalledWith('count', '7');
    });
  });

  describe('array parameter', () => {
    it('renders array values as a comma-separated text input', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={arraySchema}
          values={{options: [2, 3, 5]}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('textbox')).toHaveValue('2, 3, 5');
    });

    it('renders an empty string when the array value is absent', () => {
      render(
        <StepParameterInputs stepIndex={0} schema={arraySchema} values={{}} onChange={onChange} />,
      );
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('emits the raw text through onChange, leaving parsing to the caller', () => {
      render(
        <StepParameterInputs stepIndex={0} schema={arraySchema} values={{}} onChange={onChange} />,
      );
      fireEvent.change(screen.getByRole('textbox'), {target: {value: '1, 2'}});
      expect(onChange).toHaveBeenCalledWith('options', '1, 2');
    });
  });

  describe('labels and ids', () => {
    it('marks required params with an asterisk and optional params as (optional)', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={viewCardSchema}
          values={{count: 1}}
          onChange={onChange}
        />,
      );
      expect(screen.getByText(/target \*/i)).toBeInTheDocument();
      expect(screen.getByText(/count \(optional\)/i)).toBeInTheDocument();
    });

    it('treats every param as optional when the schema declares no required list', () => {
      render(
        <StepParameterInputs
          stepIndex={0}
          schema={{type: 'object', properties: {count: {type: 'integer', default: 1}}}}
          values={{}}
          onChange={onChange}
        />,
      );
      expect(screen.getByText(/count \(optional\)/i)).toBeInTheDocument();
    });

    it('namespaces input ids by step index so multiple steps do not collide', () => {
      render(
        <StepParameterInputs
          stepIndex={2}
          schema={viewCardSchema}
          values={{count: 1}}
          onChange={onChange}
        />,
      );
      expect(screen.getByRole('spinbutton')).toHaveAttribute('id', 'param-2-count');
      expect(screen.getByRole('combobox', {name: /target \*/i})).toHaveAttribute(
        'id',
        'param-2-target',
      );
    });
  });
});
