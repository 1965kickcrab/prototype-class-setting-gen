# UI and CSS

- Design only for mobile app screen sizes.
- Maintain the existing visual style, spacing, typography, and component scale.
- Use semantic `data-*` attributes for logic: `data-action`, `data-field`, `data-state`, and `data-entity-id`.
- CSS classes are for styling only; do not use them as JavaScript selectors.

## BEM and reuse

Use BEM class names:

```html
<article class="card card--compact">
  <h2 class="card__title">Reservation</h2>
</article>
```

- `card` is a reusable block, `card__title` is its element, and `card--compact` is its modifier.
- Reuse one role-based block for UI with the same structure and visual role across screens.
- Do not duplicate styles solely because a component appears on another screen. Avoid screen-name prefixes such as `member-`, `daycare-`, and `setting-`.
- Create a new block only when the structure, behavior, or visual role is meaningfully different.
