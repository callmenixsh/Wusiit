# Wuwiit

**What workout is it today?**

A local-first workout planner built around two simple layers:

1. **Exercise library** — reusable movements with sets, reps, form guidance, and optional details.
2. **Workout plan** — seven days that contain exercises directly, or can be marked for rest and recovery.

Muscle groups are optional exercise tags; users do not need to manage them to build a workout.

The home screen expands the current training day into its complete workout. It includes guided sets, rest timers, an elapsed workout stopwatch, history, and optional weight tracking.

## Development

```bash
npm install
npm run dev
```

Data is stored in browser local storage. The settings screen supports JSON backup and restore. Existing v1 split data is migrated automatically into the new relational model.
