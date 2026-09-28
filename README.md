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

Data is stored in browser local storage. The settings screen supports full JSON backup/restore and portable workout-plan import/export. Plan files include every day, exercise, muscle group, rest day, and warmup while leaving workout history and personal settings untouched. Existing v1 split data is migrated automatically into the new relational model.

The production build is an installable PWA and precaches the complete application shell for offline use. Active workout and rest-timer deadlines are persisted, so they recover accurately after the app is suspended or restarted.

## Push reminders

Scheduled workout and weigh-in reminders use Netlify Functions, Netlify Blobs, and Web Push. Generate VAPID keys with `npx web-push generate-vapid-keys`, then configure:

```text
VITE_VAPID_PUBLIC_KEY=<public key available at build time>
VAPID_PUBLIC_KEY=<same public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:you@example.com
```

Without those variables, the app remains fully usable offline and foreground/rest recovery still works, but closed-app scheduled push delivery is disabled.
