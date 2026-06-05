# Project Standards & Guidelines

This document tracks custom UI components, generic utility functions, and overall structural guidelines implemented in this project. **Future AI assistants should read this file** to prevent code/styling duplication and maintain standardization across UI and functionality.

## Custom Components

### `Dropdown` Component
**Path:** `components/Dropdown.js`
**Description:** A custom, stylable React dropdown component that replaces standard `<select>` HTML elements. It perfectly matches the dark "glass" theme.
**Props:**
- `options`: Array of strings `['A', 'B']` OR objects `[{label: 'A', value: '1'}]`
- `value`: Currently selected value
- `onChange`: Callback function `(value) => {}`
- `placeholder`: String placeholder when no value is selected

### `CardList` Component
**Path:** `components/CardList.js`
**Description:** A unified, interactive component for displaying a list of credit cards. It includes built-in view mode toggles (Super Condensed, Condensed, Expanded). Use this anywhere a list of cards needs to be displayed.
**Props:**
- `cards`: Array of card objects to render. You can optionally include a `highlightMultiplier` property on the card object to display a prominent yellow multiplier badge.
- `actualAccounts`: (Optional) Array of ActualBudget account objects to map `actualAccountId` to names.
- `onEdit`: (Optional) Callback `(card) => {}`. Renders an Edit button in expanded view.
- `onDelete`: (Optional) Callback `(id) => {}`. Renders a Delete button in expanded view.
- `headerRight`: (Optional) React node to render next to the view toggles (e.g., an "+ Add Card" button).
- `showNoCardsMessage`: (Optional, default `true`) Boolean to show an empty state message.
- `noCardsMessage`: (Optional) Custom string to show when the list is empty.

## CSS Classes (`app/globals.css`)

### Panels & Inputs
- `.glass-panel`: Use this for any card, form container, or list item wrapper. It provides the dark grey surface, subtle border, and rounded corners (`--radius-lg`).
- `.input-glass`: Use this on all text `<input>` fields, `<select>` (if not using Dropdown), and `<textarea>` elements. It provides the dark `#1e1f22` background and primary-color focus ring.

### Buttons
- `.btn-primary`: Primary call to action. Uses the `--primary` blue.
- `.btn-secondary`: Secondary actions. Uses the `--surface-hover` grey.
- `.btn-outline`: Outline button with transparent background and grey border.
- `.btn-outline-primary`: Outline button with transparent background and blue primary border.
- `.btn-danger`: Red button for destructive actions (e.g., Delete).
- `.btn-icon`: Transparent button for simple SVG icons.
- `.btn-sm`: Add this class alongside any button class to make it smaller (padding and text size).

### Typography & Layout
- `.page-title`: Use for `<h1>` tags at the top of pages.
- `.layout-container`: Centralized max-width wrapper (1200px) if needed for overarching layouts.

### Custom Toggles (Switches)
To create a modern toggle switch (replaces native checkboxes), use the following DOM structure:
```html
<label className="toggle-label-wrap">
  <div className="toggle-switch">
    <input type="checkbox" checked={state} onChange={e => setState(e.target.checked)} />
    <span className="toggle-slider"></span>
  </div>
  Label Text
</label>
```
