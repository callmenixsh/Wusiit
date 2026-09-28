# Wusiit

A local-first workout planner built around three reusable layers:

1. **Exercises** — movement details, equipment, sets, reps, and form instructions.
2. **Muscle groups** — reusable collections of exercises.
3. **Training days** — an ordered plan composed of one or more muscle groups.

The home screen expands the current training day into its complete workout. Starting a workout records a snapshot in history; when the configured timer ends, the plan advances to the next day.

## Development

```bash
npm install
npm run dev
```

Data is stored in browser local storage. The settings screen supports JSON backup and restore. Existing v1 split data is migrated automatically into the new relational model.
