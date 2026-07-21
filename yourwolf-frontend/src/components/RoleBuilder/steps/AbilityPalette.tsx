import {Ability} from '../../../types/transport';
import {ABILITY_CATEGORIES} from '../../../domain/constants';
import {theme} from '../../../styles/theme';

const tabRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.xs,
  marginBottom: theme.spacing.md,
  borderBottom: `1px solid ${theme.colors.secondary}`,
  paddingBottom: theme.spacing.sm,
};

const paletteStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
};

const paletteGridStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
};

const abilityButtonStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.primaryLight}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  cursor: 'pointer',
  fontSize: '0.85rem',
};

function getTabStyles(isActive: boolean): React.CSSProperties {
  return {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    border: 'none',
    borderBottom: isActive ? `2px solid ${theme.colors.primaryLight}` : '2px solid transparent',
    backgroundColor: 'transparent',
    color: isActive ? theme.colors.text : theme.colors.textMuted,
    cursor: 'pointer',
    fontWeight: isActive ? 600 : 400,
    fontSize: '0.85rem',
  };
}

export interface AbilityPaletteProps {
  /** Every ability available to the builder; filtered down to the active category here. */
  abilities: Ability[];
  loading: boolean;
  /** Id of the category tab currently selected. Owned by the container. */
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onSelectAbility: (abilityType: string, abilityName: string) => void;
}

/**
 * Category tabs plus the grid of abilities in the active category.
 *
 * Presentational: tab state lives in the container so it survives step add/remove.
 */
export function AbilityPalette({
  abilities,
  loading,
  activeCategory,
  onCategoryChange,
  onSelectAbility,
}: AbilityPaletteProps) {
  const activeTypes = ABILITY_CATEGORIES.find((c) => c.id === activeCategory)?.types ?? [];
  const paletteAbilities = abilities.filter((a) => activeTypes.includes(a.type));

  return (
    <div style={paletteStyles}>
      <div style={tabRowStyles}>
        {ABILITY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            style={getTabStyles(activeCategory === cat.id)}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{color: theme.colors.textMuted}}>Loading abilities...</p>
      ) : paletteAbilities.length === 0 ? (
        <p style={{color: theme.colors.textMuted}}>No abilities available in this category</p>
      ) : (
        <div style={paletteGridStyles}>
          {paletteAbilities.map((ability) => (
            <button
              key={ability.id}
              style={abilityButtonStyles}
              onClick={() => onSelectAbility(ability.type, ability.name)}
            >
              {ability.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
