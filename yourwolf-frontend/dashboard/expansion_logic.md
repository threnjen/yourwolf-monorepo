# Streamlit App Expansion Logic

## Motivation
To continue to make this general, we need to avoid programming in any specific card logic to the dashboard.  Without this restriction, spaghetti code will follow quickly.

To solve this, we require that each of our card attributes be completely typed, and that each type have a specific meaning.

## Card Attribute Typing

For each card attribute, the type not only denotes a variable type but also carries a logical meaning:
- `str`:  Freeform text.
- `int`:  This one is tricky.  For now I'd like to ignore, but I think in general we want this to be considered a counter or value, and if a more robust meaning exists (an `id` for example), we need to tag the integer differently.
- `Enum`:  These are categorical variables with categories managed by the app owner.
- `dict`:  Each dictionary key represents a unique OR condition.  Because there's no programmatic game logic, we don't need to distinguish between inclusive and exclusive or; all instances are assumed to be inclusive though.  Handling of dictionary values is inherited from the rest of the class (str, enum, etc.)
- `list`:  Lists are always and-statements.
- `object`:  These are pydantic base models.  For each primitive in the attributes, handle as above.

## Streamlit Interface

For each card attribute, we'll have both a interface portion and a card representation:
- `str`:  Interface exists on the card itself.
- `int`:  Unsure.  Could be either a freeform box or a dropdown
- `Enum`:  If a single `Enum`, this will be a `st.selectbox`.  If part of a list, this should be a `st.multiselect`
- `dict`:  Since dictionaries are `or` statements, we need to represent them as such.  Each key should be a separate section, and each value should be treated according to its type (`st.selectbox` for `Enum`, rows for lists, etc.).  Since nesting can occur, we need to allow for recursion.  At each nesting level, we'll include indentation to denote the section.
- `list`:  If this is a list of `Enum`, we can use a `st.multiselect`.  Otherwise, we will create a "row" in streamlit for each list item.  Each item will have a remove button to delete as desired.  If a list of `objects`, we represent each attribute in the object as a section in the "row", handling as above.
- `object`:  Each object is handled by applying the above logic to each object attribute.  If an object has a list or dictionary, we create the appropriate nesting for that object.  This will necessarily expand out quickly, especially if deep nesting is allowed.

Like python, we'll largely use indentation to denote grouping.  We need to explicitly denote the difference between "or" and "and" conditions.