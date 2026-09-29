import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ArrowLeft,
	BookOpen,
	CalendarDays,
	Check,
	ChevronDown,
	GripVertical,
	Plus,
	Trash2,
} from "lucide-react";
import { AppState, makeId, STANDARD_MUSCLE_GROUPS, WorkoutPlan } from "../lib/storage";
import {
	recommendedWarmupAreas,
	warmupStepsFor,
	WARMUP_AREAS,
} from "../lib/warmup";
import type { WarmupStep } from "../lib/warmup";
import Modal, { DialogActions, primaryButton } from "../components/Modal";

type Props = {
	state: AppState;
	todayDayIndex: number;
	onSave: (state: AppState) => void;
	templateDraftItems?:
		| { name: string; description?: string; warmup?: WarmupStep[] }[]
		| null;
	templateDraftPlan?: WorkoutPlan | null;
	templateDraftToken?: number;
	onTemplateDraftApplied?: () => void;
};
type Tab = "plan" | "library";
type Option = { id: string; label: string; meta?: string };
const clone = (s: AppState): AppState => JSON.parse(JSON.stringify(s));
const WEEKDAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];
const asWeek = (source: AppState) => {
	const s = clone(source);
	while (s.days.length < 7) {
		const i = s.days.length;
		s.days.push({
			id: makeId("day"),
			name: i === 6 ? "Rest day" : "Recovery",
			exerciseIds: [],
			isRestDay: true,
		});
	}
	s.days = s.days.slice(0, 7);
	return s;
};
const field =
	"w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white dark:focus:ring-white/10";
const homeExercise: Record<string, Partial<AppState["exercises"][number]>> = {
	"Bench press": { equipment: "Barbell", sets: 3, reps: "8–12", instructions: "Retract your shoulder blades, keep your feet planted, and lower the bar with control." },
	"Overhead press": { equipment: "Barbell", sets: 3, reps: "8–12", instructions: "Brace your core and press overhead without leaning back." },
	"Barbell row": { equipment: "Barbell", sets: 3, reps: "8–12", instructions: "Hinge at the hips and pull the bar toward your lower ribs." },
	"Lat pulldown": { equipment: "Cable", sets: 3, reps: "10–12", instructions: "Drive your elbows down without swinging your torso." },
	Squat: { equipment: "Barbell", sets: 3, reps: "6–10", instructions: "Brace, sit between your hips, and track knees over toes." },
	"Romanian deadlift": { equipment: "Barbell", sets: 3, reps: "8–12", instructions: "Push hips back with a neutral spine and keep the bar close." },
	"Chair-assisted squat": {sets: 2, reps: "8", instructions: "Stand in front of a stable chair. Sit back under control, lightly touch the seat, then stand using the chair for support if needed.", commonMistakes: "Avoid dropping onto the chair, letting the knees cave inward, or holding your breath."},
	"Wall push-up": {sets: 2, reps: "8", instructions: "Place your hands on a wall around chest height, keep your body straight, lower your chest toward the wall, then press away.", commonMistakes: "Avoid sagging at the hips, flaring the elbows straight out, or rushing the movement."},
	"Beginner glute bridge": {sets: 2, reps: "10", instructions: "Lie on your back with knees bent. Press through your feet, squeeze your glutes to lift your hips, then lower slowly.", commonMistakes: "Avoid pushing through the toes or arching the lower back."},
	"Standing alternating knee raise": {sets: 2, reps: "10 / side", instructions: "Stand tall near a wall for balance and slowly lift one knee, lower it, then alternate sides.", commonMistakes: "Avoid leaning backward, rushing, or pulling the knee beyond a comfortable height."},
	"Beginner calf raise": {sets: 2, reps: "12", instructions: "Hold a wall lightly, rise onto the balls of both feet, pause, and lower with control.", commonMistakes: "Avoid bouncing or rolling the ankles outward."},
	"Bird dog": {sets: 2, reps: "5 / side", instructions: "From hands and knees, extend the opposite arm and leg, pause while keeping the trunk steady, then switch sides.", commonMistakes: "Avoid rotating the hips, arching the lower back, or reaching higher than you can control."},
	"Sit-to-stand": {sets: 2, reps: "8", instructions: "Sit near the front of a stable chair, lean slightly forward, stand through both feet, then sit down slowly.", commonMistakes: "Avoid dropping into the chair, letting the knees cave inward, or using momentum."},
	"Supported reverse leg raise": {sets: 2, reps: "10 / side", instructions: "Hold a wall or chair, stand tall, and extend one straight leg slightly behind you by squeezing the glute. Alternate sides.", commonMistakes: "Avoid leaning forward, arching the lower back, or swinging the leg."},
	"Beginner wall sit": {tracking: "timed", sets: 2, durationSeconds: 15, instructions: "Lean against a wall and slide down only as far as feels comfortable. Hold while breathing steadily.", commonMistakes: "Avoid forcing a deep position, letting the knees cave inward, or holding your breath."},
	"Beginner dead bug": {sets: 2, reps: "5 / side", instructions: "Lie on your back with knees bent and arms raised. Slowly extend the opposite arm and leg while keeping your lower back comfortable, then switch.", commonMistakes: "Use a smaller range if your back arches, and avoid moving quickly."},
	"Easy walk or indoor march": {tracking: "timed", sets: 1, durationSeconds: 1200, instructions: "Walk outside, use a treadmill, or march around the room at an easy pace. Breathe harder but stay able to speak in short sentences.", commonMistakes: "Do not turn this into a speed test. Slow down or stop if breathing feels disproportionate, you wheeze, feel dizzy, or have chest tightness or pain."},
	"Leisurely walk": {tracking: "timed", sets: 1, durationSeconds: 600, instructions: "Walk at a deliberately easy recovery pace for 10 to 15 minutes.", commonMistakes: "Keep this easy; it is recovery, not a conditioning test."},
	"Gentle mobility flow": {sets: 1, reps: "1 gentle round", instructions: "Move through hip circles, shoulder circles, a gentle chest stretch, hip-flexor stretch, calf stretch, and hamstring stretch. Stop after one relaxed round.", commonMistakes: "Do not bounce or force a stretch into pain."},
	"Bodyweight squat": {
		sets: 3,
		reps: "12–15",
		instructions:
			"Stand shoulder-width apart, sit your hips back and down, then drive through the whole foot.",
		commonMistakes:
			"Avoid knees collapsing inward, heels lifting, or rounding the lower back.",
	},
	"Push-Up": {
		sets: 3,
		reps: "8–20",
		instructions:
			"Place your hands slightly wider than shoulder-width and make a straight line from head to heels. Brace your abs and glutes, lower your chest toward the floor with elbows 30–60 degrees from your body, then push the floor away. When 20 clean reps feel easy, lower for 3 seconds and pause at the bottom.",
		commonMistakes:
			"Avoid sagging or raised hips, fully flared elbows, half reps, or reaching your head toward the floor before your chest.",
	},
	"Wide Push-Up": {
		sets: 3,
		reps: "8–20",
		instructions:
			"Set your hands wider than shoulder-width, brace your whole body, and lower your chest under control. Press back up while keeping your hips and shoulders moving together.",
		commonMistakes:
			"Avoid placing your hands excessively wide, flaring your elbows straight out, sagging at the hips, or shortening the range.",
	},
	"Close-Grip Push-Up": {
		sets: 3,
		reps: "6–15",
		instructions:
			"Place your hands just inside shoulder-width. Keep your elbows close to your ribs as you lower your chest, then press the floor away until your arms are straight.",
		commonMistakes:
			"Avoid spreading your elbows, letting your hips sag, or forcing your hands into a narrow diamond if it bothers your wrists.",
	},
	"Superman Pull-Down": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Lie face down with your arms extended overhead. Lift your chest and hands slightly, then pull your elbows down toward your ribs while squeezing your upper back. Reach forward again before lowering.",
		commonMistakes:
			"Keep your neck neutral and legs relaxed; avoid cranking your chest high or rushing through the squeeze.",
	},
	"Reverse Snow Angel": {
		sets: 3,
		reps: "10–15",
		instructions:
			"Lie face down with your hands near your hips and palms down. Lift your hands slightly and sweep your arms in a wide arc overhead, then return slowly while squeezing your upper back.",
		commonMistakes:
			"Avoid shrugging, bending your elbows excessively, lifting your head, or using momentum.",
	},
	"Prone Y-T-W": {
		sets: 3,
		reps: "6–10 each position",
		instructions:
			"Lie face down and lift your arms into a Y, then out into a T, then bend your elbows into a W. Pause and squeeze your shoulder blades in each position.",
		commonMistakes:
			"Use a small controlled range; avoid shrugging, arching your lower back, or throwing your arms upward.",
	},
	"Self-Resisted Biceps Curl": {
		sets: 3,
		reps: "10–15 / arm",
		instructions:
			"Hold one wrist with the opposite hand. Curl the working arm upward while the other hand supplies steady resistance, then resist the lowering phase. Switch sides after the set.",
		commonMistakes:
			"Keep the working elbow beside your ribs; avoid twisting your torso, letting resistance disappear, or moving too quickly.",
	},
	"Glute bridge": {
		sets: 3,
		reps: "12–15",
		instructions:
			"Drive through your heels and squeeze your glutes at the top without arching your back.",
		commonMistakes:
			"Do not push through the toes or overextend the lower back.",
	},
	Superman: {
		sets: 3,
		reps: "10–12",
		instructions: "Lift arms and legs gently while keeping your neck neutral.",
		commonMistakes: "Avoid throwing the limbs upward or cranking the neck.",
	},
	"Mountain climbers": {
		tracking: "timed",
		sets: 3,
		durationSeconds: 30,
		instructions:
			"Hold a strong plank and alternate driving each knee toward your chest.",
		commonMistakes:
			"Avoid bouncing hips, collapsed shoulders, and sacrificing form for speed.",
	},
	"Forearm plank": {
		tracking: "timed",
		sets: 3,
		durationSeconds: 30,
		instructions:
			"Brace your trunk and maintain a straight line from head to heels.",
		commonMistakes:
			"Do not let the hips sag or rise, and avoid holding your breath.",
	},
	"Dead bug": {
		sets: 3,
		reps: "8–10 / side",
		instructions:
			"Keep your lower back gently pressed down as opposite arm and leg extend.",
		commonMistakes: "Avoid arching the lower back or moving too quickly.",
	},
	"Jumping jacks": {
		tracking: "timed",
		sets: 3,
		durationSeconds: 30,
		instructions:
			"Land softly while moving arms and legs through a comfortable range.",
		commonMistakes:
			"Avoid locked knees, heavy landings, or shrugging the shoulders.",
	},
	"Reverse Lunge": {
		sets: 3,
		reps: "10–20 / leg",
		instructions:
			"Stand tall, take a comfortable step backward, and lower your rear knee toward the floor. Push through your front foot to return to standing, keeping every rep controlled.",
		commonMistakes:
			"Avoid letting the front knee cave inward, taking tiny steps, slamming the rear knee down, or pushing excessively from the rear toes.",
	},
	"Single-leg glute bridge": {
		sets: 3,
		reps: "8–12 / side",
		instructions:
			"Keep hips level and extend them using the planted-side glute.",
		commonMistakes:
			"Avoid rotating the pelvis or driving through the lower back.",
	},
	"Calf raise": {
		sets: 3,
		reps: "15–20",
		instructions:
			"Rise onto the ball of the foot, pause, and lower through the full range.",
		commonMistakes: "Avoid bouncing or rolling the ankles outward.",
	},
	"Wall sit": {
		tracking: "timed",
		sets: 3,
		durationSeconds: 30,
		instructions:
			"Keep your back against the wall with knees tracking over the feet.",
		commonMistakes:
			"Avoid placing hands on the thighs or letting knees cave inward.",
	},
	"Feet-Elevated Push-Up": {
		sets: 3,
		reps: "8–15",
		instructions:
			"Place your feet on a stable chair or bed and set your hands just wider than shoulder-width. Brace your body, lower your chest between your hands, then press the floor away. Stop each set with 1–2 clean reps left.",
		commonMistakes:
			"Keep your hips level, elbows about 30–45 degrees from your body, and head in line with your spine.",
	},
	"Dumbbell Floor Press": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Lie on your back with knees bent and a dumbbell in each hand. Start with your elbows on or near the floor, press straight up, then lower for 3 seconds until your upper arms gently touch down. Pause briefly before the next rep.",
		commonMistakes:
			"Do not bounce your elbows off the floor, flare them straight sideways, slam the weights together, or excessively arch your lower back.",
	},
	"Push-up drop set": {
		sets: 2,
		reps: "Drop set, to failure",
		instructions:
			"Start with your feet elevated and each round move your feet closer to the floor so the push-ups get harder. Keep going until you cannot do a clean rep.",
		commonMistakes:
			"Avoid letting your hips sag as the set gets harder, and stop before your form falls apart.",
	},
	"Pike Push-Up": {
		sets: 3,
		reps: "6–15",
		instructions:
			"Start on hands and feet, lift your hips high, and shift your weight toward your hands. Bend your elbows to lower the crown of your head slightly in front of your hands, then press back to the start. Elevate your feet on a stable chair when regular reps become easy.",
		commonMistakes:
			"Keep your hips high and hands around shoulder-width; do not turn it into a regular push-up or let your head crash into the floor.",
	},
	"Dumbbell Lateral Raise": {
		sets: 3,
		reps: "15–30",
		instructions:
			"Stand tall with light dumbbells beside your thighs and a soft bend in your elbows. Raise your arms out to the sides to about shoulder height, then lower slowly. With lighter weights, make every rep controlled.",
		commonMistakes:
			"Avoid swinging your body, shrugging, turning it into a front raise, or lifting far above shoulder height.",
	},
	"Dumbbell Rear-Delt Raise": {
		sets: 3,
		reps: "12–20",
		instructions:
			"Hinge forward with a flat back and let the dumbbells hang below your shoulders. Sweep your arms out wide, pause when they align with your torso, then lower slowly.",
		commonMistakes:
			"Use light weights; avoid shrugging, bending the elbows into a row, or lifting your torso during each rep.",
	},
	"Chair dips": {
		sets: 3,
		reps: "8–20",
		instructions:
			"Sit on the edge of a sturdy chair with your hands beside your hips and slide your hips off the front. Bend your elbows to lower yourself, then press back up.",
		commonMistakes:
			"Avoid letting your shoulders ride up by your ears, or dropping low enough to strain them.",
	},
	"Overhead Dumbbell Triceps Extension": {
		sets: 3,
		reps: "10–15",
		instructions:
			"Hold one dumbbell securely with both hands overhead. Keep your ribs down and upper arms still as you lower the weight behind your head, then straighten your elbows fully.",
		commonMistakes:
			"Avoid flaring your elbows wide, arching your lower back, or rushing the bottom of the rep.",
	},
	"Backpack Bent-Over Row": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Load and firmly close a backpack, hold it with both hands, then hinge forward with a neutral back. Pull it toward your lower ribs or waist by driving your elbows back, squeeze your shoulder blades, then lower slowly.",
		commonMistakes:
			"Think “pull elbows back,” not “curl the backpack.” Avoid rounding your back, standing upright each rep, yanking the bag, or shrugging.",
	},
	"One-Arm Backpack Row": {
		sets: 4,
		reps: "8–15 / side",
		instructions:
			"Brace one hand on a stable chair and hold the backpack in the other. Let your shoulder reach down, then drive your elbow toward your hip and pause before lowering under control.",
		commonMistakes:
			"Keep your hips and chest square to the floor; avoid twisting, shrugging, or yanking the weight.",
	},
	"Resistance Band Row": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Securely anchor the band and sit or stand with your arms extended. Pull the handles toward your torso by driving your elbows back, squeeze your shoulder blades, then return slowly under control.",
		commonMistakes:
			"Check the anchor before starting. Avoid leaning backward to cheat, using momentum, shrugging, or letting the band snap you forward.",
	},
	"Dumbbell Pullover": {
		sets: 3,
		reps: "10–15",
		instructions:
			"Lie on the floor and hold one dumbbell above your chest with both hands. With a slight elbow bend and ribs pulled down, lower it behind your head only as far as your shoulders allow, then pull it back over your chest.",
		commonMistakes:
			"Do not force extra range, flare your ribs, or turn the movement into a triceps extension.",
	},
	"Resistance Band Face Pull": {
		sets: 3,
		reps: "15–25",
		instructions:
			"Anchor the band securely at face height. Pull toward your face while letting your hands separate toward your ears, squeeze your upper back and rear shoulders, then return slowly.",
		commonMistakes:
			"Avoid pulling toward your chest, leaning back, moving your whole body, or using more resistance than you can control.",
	},
	"Dumbbell Curl": {
		sets: 3,
		reps: "12–25",
		instructions:
			"Stand tall with your arms extended and palms forward. Keep your elbows beside your ribs, curl the dumbbells, squeeze your biceps, then lower slowly. If the weight feels light, use a 3-second lowering phase and pause before curling again.",
		commonMistakes:
			"Avoid swinging your torso, moving your elbows forward, dropping the weights quickly, or cutting the bottom of the rep short.",
	},
	"Hammer Curl": {
		sets: 3,
		reps: "12–20",
		instructions:
			"Stand tall with the dumbbells at your sides and palms facing each other. Keep your elbows close to your ribs, curl without rotating your wrists, squeeze briefly, then lower slowly.",
		commonMistakes:
			"Avoid swinging your torso, drifting your elbows forward, rotating your palms, or dropping the weights quickly.",
	},
	"Band curls": {
		sets: 2,
		reps: "15–25",
		instructions:
			"Stand on the middle of a band and hold both ends under your hands. Curl your hands up toward your shoulders with your elbows still, then lower slowly.",
		commonMistakes:
			"Avoid letting your elbows ride forward, or jerking the band instead of curling.",
	},
	"Bulgarian Split Squat": {
		sets: 3,
		reps: "10–15 / leg",
		instructions:
			"Place your rear foot on a stable chair and set your front foot far enough forward to squat comfortably. Lower your hips toward the floor, keep the front foot planted, then drive through it to stand. Begin with bodyweight and add dumbbells or a backpack when needed.",
		commonMistakes:
			"Your front leg should do most of the work. Avoid lifting the front heel, letting the knee cave inward, relying on the rear leg, or taking shallow reps.",
	},
	"Bulgarian split squat burnout": {
		sets: 2,
		reps: "Bodyweight, to failure",
		instructions:
			"Use the same stance with no backpack or dumbbells. Keep lowering slowly and go until you can no longer stand up cleanly.",
		commonMistakes:
			"Avoid losing your balance, or turning the set into fast shallow reps.",
	},
	"Loaded Backpack Squat": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Wear a securely loaded backpack or hug it against your chest. Stand around shoulder-width, brace your core, sit down and back as deeply as you can control, then push through the floor to stand.",
		commonMistakes:
			"Avoid knees collapsing inward, heels lifting, losing balance from excess weight, or shortening the movement into shallow reps.",
	},
	"Single-Leg Romanian Deadlift": {
		sets: 3,
		reps: "8–12 / leg",
		instructions:
			"Stand on one leg with a soft knee and reach both arms forward as your free leg extends behind you. Hinge at the hip, pause when your hamstring is stretched, then squeeze your glute to stand.",
		commonMistakes:
			"Keep both hips facing the floor; avoid rounding your back, reaching down with one shoulder, or locking the standing knee.",
	},
	"Backpack Romanian Deadlift": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Hold a loaded backpack close to your legs with a slight knee bend. Push your hips back until your hamstrings stretch, then drive your hips forward to stand. Think: hips back, feel the stretch, hips forward.",
		commonMistakes:
			"Do not squat the weight down, round your back, let the backpack drift away, or hyperextend your lower back at the top.",
	},
	"Walking lunges": {
		sets: 3,
		reps: "12–20 / leg",
		instructions:
			"Step forward into a long stride and lower your back knee toward the floor. Push through your front foot to stand up, then step forward with the other leg.",
		commonMistakes:
			"Avoid taking short steps, letting your front knee slam forward, or losing balance at the bottom.",
	},
	"Single-Leg Hip Thrust": {
		sets: 3,
		reps: "12–20 / leg",
		instructions:
			"Rest your upper back against a stable chair or couch, plant one foot, and raise the other leg. Drive your hips upward through the planted foot, squeeze your glute hard at the top, then lower under control.",
		commonMistakes:
			"Keep your hips level and ribs down; avoid hyperextending your lower back to gain extra height or pushing only through your toes.",
	},
	"Single-Leg Calf Raise": {
		sets: 3,
		reps: "12–20 / leg",
		instructions:
			"Stand on one foot, rise onto the ball of your foot as high as possible, pause, then lower for 2–3 seconds. Touch a wall lightly only if you need help balancing.",
		commonMistakes:
			"Avoid bouncing, rolling the ankle outward, bending the knee, or using your supporting hand to pull yourself up.",
	},
	"Reverse Crunch": {
		sets: 3,
		reps: "10–15",
		instructions:
			"Lie on your back with hips and knees bent to 90 degrees. Press your lower back down, curl your pelvis toward your ribs until your hips lift slightly, then lower slowly without swinging.",
		commonMistakes:
			"Avoid kicking your legs, using momentum, or turning the movement into a large hip swing.",
	},
	"Leg raises": {
		sets: 3,
		reps: "10–20",
		instructions:
			"Lie on your back with your hands under your hips and your legs straight. Lift your legs to about 45 degrees, then lower them slowly without touching the floor.",
		commonMistakes:
			"Avoid pulling on your hips with your hands, or dropping your legs too fast.",
	},
	"Forearm Plank": {
		tracking: "timed",
		sets: 3,
		durationSeconds: 30,
		instructions:
			"Place your elbows under your shoulders and extend your legs behind you. Squeeze your glutes, brace as if preparing for a punch, and keep a straight line while breathing slowly.",
		commonMistakes:
			"End the set when your hips sag or rise; do not hold your breath or crane your head upward.",
	},
};
const musclesByExercise: Record<string, string[]> = {
	"Chair-assisted squat": ["Quadriceps", "Glutes"],
	"Wall push-up": ["Chest", "Shoulders", "Triceps"],
	"Beginner glute bridge": ["Glutes", "Hamstrings"],
	"Standing alternating knee raise": ["Abs", "Quadriceps"],
	"Beginner calf raise": ["Calves"],
	"Bird dog": ["Abs", "Lower Back", "Glutes"],
	"Sit-to-stand": ["Quadriceps", "Glutes"],
	"Supported reverse leg raise": ["Glutes", "Hamstrings"],
	"Beginner wall sit": ["Quadriceps", "Glutes"],
	"Beginner dead bug": ["Abs"],
	"Easy walk or indoor march": ["Full Body"],
	"Leisurely walk": ["Full Body"],
	"Gentle mobility flow": ["Full Body"],
	"Bench press": ["Chest", "Triceps", "Shoulders"],
	"Incline dumbbell press": ["Chest", "Triceps", "Shoulders"],
	"Shoulder press": ["Shoulders", "Triceps"],
	"Lateral raises": ["Shoulders"],
	"Triceps pushdown": ["Triceps"],
	"Pull-ups": ["Back", "Biceps"],
	"Lat pulldown": ["Back", "Biceps"],
	"Barbell row": ["Back", "Biceps"],
	"Face pull": ["Shoulders", "Back"],
	"Bicep curls": ["Biceps"],
	Squats: ["Quadriceps", "Glutes"],
	"Romanian deadlift": ["Hamstrings", "Glutes"],
	"Leg press": ["Quadriceps", "Glutes"],
	"Leg curls": ["Hamstrings"],
	"Calf raises": ["Calves"],
	"Incline press": ["Chest", "Shoulders", "Triceps"],
	Rows: ["Back", "Biceps"],
	Pulldowns: ["Back", "Biceps"],
	"Overhead press": ["Shoulders", "Triceps"],
	Curls: ["Biceps"],
	"Skull crushers": ["Triceps"],
	"Hammer curls": ["Biceps", "Forearms"],
	Lunges: ["Quadriceps", "Glutes", "Hamstrings"],
	"Hamstring curls": ["Hamstrings"],
	Calves: ["Calves"],
	"Lat machine top": ["Back", "Biceps"],
	"Lat machine bottom": ["Back", "Biceps"],
	Rowing: ["Back", "Biceps"],
	"One-arm rowing": ["Back", "Biceps"],
	"Bench flat": ["Chest", "Triceps"],
	"Bench incline": ["Chest", "Shoulders", "Triceps"],
	"Bench decline": ["Chest", "Triceps"],
	Flys: ["Chest"],
	Pushups: ["Chest", "Shoulders", "Triceps"],
	Hammer: ["Biceps", "Forearms"],
	Barbell: ["Biceps"],
	Preacher: ["Biceps"],
	Press: ["Shoulders", "Triceps"],
	Lateral: ["Shoulders"],
	Front: ["Shoulders"],
	Shrugs: ["Shoulders", "Back"],
	Extensions: ["Quadriceps"],
	"Bodyweight squat": ["Quadriceps", "Glutes"],
	"Push-Up": ["Chest", "Shoulders", "Triceps"],
	"Wide Push-Up": ["Chest", "Shoulders", "Triceps"],
	"Close-Grip Push-Up": ["Chest", "Triceps", "Shoulders"],
	"Superman Pull-Down": ["Back", "Lower Back"],
	"Reverse Snow Angel": ["Back", "Shoulders"],
	"Prone Y-T-W": ["Back", "Shoulders"],
	"Self-Resisted Biceps Curl": ["Biceps"],
	"Glute bridge": ["Glutes", "Hamstrings"],
	Superman: ["Lower Back", "Glutes"],
	"Mountain climbers": ["Abs", "Shoulders"],
	"Forearm plank": ["Abs", "Lower Back"],
	"Dead bug": ["Abs"],
	"Jumping jacks": ["Quadriceps", "Calves", "Shoulders"],
	"Reverse Lunge": ["Quadriceps", "Glutes", "Hamstrings"],
	"Single-leg glute bridge": ["Glutes", "Hamstrings"],
	"Calf raise": ["Calves"],
	"Wall sit": ["Quadriceps", "Glutes"],
	"Feet-Elevated Push-Up": ["Chest", "Shoulders", "Triceps"],
	"Dumbbell Floor Press": ["Chest", "Shoulders", "Triceps"],
	"Push-up drop set": ["Chest", "Shoulders", "Triceps"],
	"Pike Push-Up": ["Shoulders", "Triceps"],
	"Dumbbell Lateral Raise": ["Shoulders"],
	"Dumbbell Rear-Delt Raise": ["Shoulders", "Back"],
	"Chair dips": ["Triceps", "Chest"],
	"Overhead Dumbbell Triceps Extension": ["Triceps"],
	"Backpack Bent-Over Row": ["Back", "Biceps"],
	"One-Arm Backpack Row": ["Back", "Biceps"],
	"Resistance Band Row": ["Back", "Biceps"],
	"Dumbbell Pullover": ["Back", "Triceps"],
	"Resistance Band Face Pull": ["Shoulders", "Back"],
	"Dumbbell Curl": ["Biceps"],
	"Hammer Curl": ["Biceps", "Forearms"],
	"Band curls": ["Biceps"],
	"Bulgarian Split Squat": ["Quadriceps", "Glutes"],
	"Bulgarian split squat burnout": ["Quadriceps", "Glutes"],
	"Loaded Backpack Squat": ["Quadriceps", "Glutes"],
	"Single-Leg Romanian Deadlift": ["Hamstrings", "Glutes"],
	"Backpack Romanian Deadlift": ["Hamstrings", "Glutes"],
	"Walking lunges": ["Quadriceps", "Glutes", "Hamstrings"],
	"Single-Leg Hip Thrust": ["Glutes", "Hamstrings"],
	"Single-Leg Calf Raise": ["Calves"],
	"Reverse Crunch": ["Abs"],
	"Leg raises": ["Abs"],
	"Forearm Plank": ["Abs", "Lower Back"],
};

function MultiSelect({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: Option[];
	value: string[];
	onChange: (ids: string[]) => void;
}) {
	const [open, setOpen] = useState(false),
		root = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const close = (e: MouseEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, []);
	const selected = value
		.map((id) => options.find((option) => option.id === id))
		.filter((option): option is Option => Boolean(option));
	return (
		<div ref={root} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className={`${field} flex min-h-[42px] items-center gap-2 text-left`}
			>
				<span
					className={`min-w-0 flex-1 truncate ${selected.length ? "" : "text-black/40 dark:text-white/40"}`}
				>
					{selected.length === 0
						? label
						: selected.length <= 2
							? selected.map((x) => x.label).join(", ")
							: `${selected.length} selected`}
				</span>
				{selected.length > 0 && (
					<span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-black">
						{selected.length}
					</span>
				)}
				<ChevronDown
					size={15}
					className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
				/>
			</button>
			{open && (
				<div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-black/15 bg-white p-1.5 shadow-xl dark:border-white/20 dark:bg-neutral-950">
					{options.length ? (
						options.map((o) => {
							const checked = value.includes(o.id);
							return (
								<button
									type="button"
									key={o.id}
									onClick={() =>
										onChange(
											checked
												? value.filter((id) => id !== o.id)
												: [...value, o.id],
										)
									}
									className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
								>
									<span
										className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/20 dark:border-white/25"}`}
									>
										{checked && <Check size={13} />}
									</span>
									<span className="min-w-0 flex-1 truncate text-sm font-medium">
										{o.label}
									</span>
									{o.meta && (
										<span className="text-[10px] text-black/40 dark:text-white/40">
											{o.meta}
										</span>
									)}
								</button>
							);
						})
					) : (
						<div className="px-3 py-5 text-center text-xs text-black/45 dark:text-white/45">
							Nothing available yet
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function SortableExercise({ option }: { option: Option }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: option.id });
	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-black ${isDragging ? "z-10 opacity-70 shadow-lg" : ""}`}
		>
			<button
				type="button"
				aria-label={`Reorder ${option.label}`}
				className="cursor-grab touch-none text-black/35 active:cursor-grabbing dark:text-white/35"
				{...attributes}
				{...listeners}
			>
				<GripVertical size={18} />
			</button>
			<span className="min-w-0 flex-1 truncate text-sm font-medium">{option.label}</span>
			{option.meta && <span className="text-[10px] opacity-40">{option.meta}</span>}
		</div>
	);
}

function ExerciseOrder({ options, value, onChange }: {
	options: Option[];
	value: string[];
	onChange: (ids: string[]) => void;
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const selected = value
		.map((id) => options.find((option) => option.id === id))
		.filter((option): option is Option => Boolean(option));
	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		const from = value.indexOf(String(active.id));
		const to = value.indexOf(String(over.id));
		if (from >= 0 && to >= 0) onChange(arrayMove(value, from, to));
	};
	if (selected.length < 2) return null;
	return (
		<div className="mt-3">
			<div className="mb-2 text-[10px] font-semibold uppercase tracking-widest opacity-40">Exercise order</div>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={value} strategy={verticalListSortingStrategy}>
					<div className="space-y-2">{selected.map((option) => <SortableExercise key={option.id} option={option} />)}</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}

function SortableDayCard({
	day,
	weekday,
	isToday,
	onOpen,
}: {
	day: AppState["days"][number];
	weekday: string;
	isToday: boolean;
	onOpen: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: day.id });
	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`flex items-center rounded-2xl border bg-white transition dark:bg-black ${isToday ? "border-black/60 dark:border-white/70" : "border-black/10 hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"} ${isDragging ? "z-20 opacity-70 shadow-xl" : ""}`}
		>
			<button
				type="button"
				aria-label={`Move ${day.name || "untitled workout"} from ${weekday}`}
				className="ml-2 flex min-h-12 w-9 shrink-0 touch-none cursor-grab items-center justify-center text-black/35 active:cursor-grabbing dark:text-white/35"
				{...attributes}
				{...listeners}
			>
				<GripVertical size={18} />
			</button>
			<button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 p-4 pl-1 text-left">
				<span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-black/[.05] text-[9px] font-bold uppercase text-black/45 dark:bg-white/[.08] dark:text-white/45">
					{weekday.slice(0, 3)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate font-semibold">{day.name || "Untitled day"}</span>
					<span className="mt-1 block truncate text-xs text-black/45 dark:text-white/45">
						{day.isRestDay
							? "Rest / recovery"
							: `${day.exerciseIds.length} exercises · ${day.warmup?.length ? `${day.warmup.length} warm-up steps` : "automatic warm-up"}`}
					</span>
				</span>
				<ChevronDown size={17} className="-rotate-90 text-black/35 dark:text-white/35" />
			</button>
		</div>
	);
}

function NativeSelect({
	value,
	onChange,
	children,
}: {
	value: string;
	onChange: (value: string) => void;
	children: React.ReactNode;
}) {
	return (
		<div className="relative">
			<select
				className={`${field} appearance-none pr-9`}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				{children}
			</select>
			<ChevronDown
				size={15}
				className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45"
			/>
		</div>
	);
}

export default function QueueEditor({
	state,
	todayDayIndex,
	onSave,
	templateDraftItems,
	templateDraftPlan,
	templateDraftToken,
	onTemplateDraftApplied,
}: Props) {
	const [tab, setTab] = useState<Tab>("plan"),
		[draft, setDraft] = useState(() => asWeek(state)),
		[expanded, setExpanded] = useState<string | null>(null);
	const [validationMessage, setValidationMessage] = useState("");
	useEffect(() => setDraft(asWeek(state)), [state]);
	useEffect(() => {
		if (templateDraftPlan) {
			setDraft(asWeek({ ...clone(state), ...JSON.parse(JSON.stringify(templateDraftPlan)) }));
			setTab("plan");
			setExpanded(null);
			onTemplateDraftApplied?.();
			return;
		}
		if (!templateDraftItems?.length) return;
		const next: AppState = {
			exercises: [],
			muscleGroups: STANDARD_MUSCLE_GROUPS.map((group) => ({
				...group,
				exerciseIds: [],
			})),
			days: [],
			history: clone(state).history,
			weightTracking: clone(state).weightTracking,
			weeklyWorkoutGoal: state.weeklyWorkoutGoal,
			restSeconds: state.restSeconds,
			restTimerSound: state.restTimerSound,
			restTimerVibration: state.restTimerVibration,
			reminders: clone(state).reminders,
		};
		const ensureGroup = (name: string) => {
			let group = next.muscleGroups.find((g) => g.name === name);
			if (!group) {
				group = { id: makeId("group"), name, exerciseIds: [] };
				next.muscleGroups.push(group);
			}
			return group;
		};
		templateDraftItems.forEach((item) => {
			if (item.description === "__REST__") {
				next.days.push({
					id: makeId("day"),
					name: item.name,
					exerciseIds: [],
					isRestDay: true,
				});
				return;
			}
			const dayExerciseIds: string[] = [];
			(item.description || "")
				.split("\n")
				.map((x) => x.trim())
				.filter(Boolean)
				.forEach((name) => {
					const muscleNames = musclesByExercise[name] || ["Full Body"];
					const groupIds = muscleNames.map((muscle) => ensureGroup(muscle).id);
					let exercise = next.exercises.find((ex) => ex.name === name);
					if (!exercise) {
						const preset = homeExercise[name] || {};
						exercise = {
							id: makeId("ex"),
							name,
							tracking: preset.tracking || "reps",
							sets: preset.sets || 3,
							reps: preset.reps || "8–12",
							muscleGroupIds: groupIds,
							...preset,
						};
						next.exercises.push(exercise);
					}
					if (!dayExerciseIds.includes(exercise.id))
						dayExerciseIds.push(exercise.id);
					exercise.muscleGroupIds = [
						...new Set([...(exercise.muscleGroupIds || []), ...groupIds]),
					];
					groupIds.forEach((groupId) => {
						const group = next.muscleGroups.find((g) => g.id === groupId)!;
						if (!group.exerciseIds.includes(exercise!.id))
							group.exerciseIds.push(exercise!.id);
					});
				});
			const warmup = (item.warmup || []).map((step) => ({ ...step }));
			next.days.push({
				id: makeId("day"),
				name: item.name,
				exerciseIds: dayExerciseIds,
				...(warmup.length ? { warmup } : {}),
			});
		});
		setDraft(next);
		setTab("plan");
		setExpanded(null);
		onTemplateDraftApplied?.();
	}, [templateDraftToken]);
	const dirty = useMemo(
		() => JSON.stringify(draft) !== JSON.stringify(state),
		[draft, state],
	);
	const update = (fn: (s: AppState) => void) =>
		setDraft((old) => {
			const next = clone(old);
			fn(next);
			return next;
		});
	const groupOptions = draft.muscleGroups.map((x) => ({
		id: x.id,
		label: x.name || "Untitled group",
		meta: `${x.exerciseIds.length} exercises`,
	}));
	const exerciseOptions = draft.exercises.map((x) => ({
		id: x.id,
		label: x.name || "Untitled exercise",
		meta:
			x.tracking === "timed"
				? `${x.durationSeconds || 30}s × ${x.sets || 3}`
				: `${x.sets || 3} × ${x.reps || "8–12"}`,
	}));
	const removeExercise = (id: string) =>
		update((s) => {
			s.exercises = s.exercises.filter((x) => x.id !== id);
			s.days.forEach(
				(d) => (d.exerciseIds = d.exerciseIds.filter((x) => x !== id)),
			);
			s.muscleGroups.forEach(
				(g) => (g.exerciseIds = g.exerciseIds.filter((x) => x !== id)),
			);
		});
	const tabs = [
		{
			id: "plan" as const,
			label: "Workout Plan",
			Icon: CalendarDays,
			count: draft.days.length,
		},
		{
			id: "library" as const,
			label: "Exercise Library",
			Icon: BookOpen,
			count: draft.exercises.length,
		},
	];
	const addExercise = () => {
		const id = makeId("ex");
		update((s) =>
			s.exercises.push({
				id,
				name: "",
				tracking: "reps",
				sets: 3,
				reps: "8–12",
			}),
		);
		setExpanded(id);
	};
	const editingDay =
		tab === "plan" ? draft.days.find((day) => day.id === expanded) : undefined;
	const editingExercise =
		tab === "library"
			? draft.exercises.find((ex) => ex.id === expanded)
			: undefined;
	const saveDraft = () => {
		const incomplete = draft.exercises.find(
			(ex) =>
				!ex.name.trim() ||
				!(
					ex.muscleGroupIds?.length ||
					draft.muscleGroups.some((g) => g.exerciseIds.includes(ex.id))
				),
		);
		if (incomplete) {
			setTab("library");
			setExpanded(incomplete.id);
			setValidationMessage(
				"Add a name and at least one muscle group to every exercise before saving.",
			);
			return;
		}
		const incompleteWarmup = draft.days.find((day) =>
			day.warmup?.some((step) => !step.name.trim()),
		);
		if (incompleteWarmup) {
			setTab("plan");
			setExpanded(incompleteWarmup.id);
			setValidationMessage(
				"Give every warm-up step a movement name before saving.",
			);
			return;
		}
		if (!draft.days.length) {
			setValidationMessage("Add at least one training day before saving.");
			return;
		}
		onSave(draft);
	};
	const suggestedAreas = (day: AppState["days"][number]) => {
		const groupIds = new Set(
			draft.exercises
				.filter((ex) => day.exerciseIds.includes(ex.id))
				.flatMap((ex) => ex.muscleGroupIds || []),
		);
		return recommendedWarmupAreas(
			draft.muscleGroups
				.filter((group) => groupIds.has(group.id))
				.map((group) => group.name),
		);
	};
	const setDayWarmup = (dayId: string, warmup: WarmupStep[] | undefined) =>
		update((s) => {
			const day = s.days.find((item) => item.id === dayId);
			if (day) {
				if (warmup?.length) day.warmup = warmup;
				else delete day.warmup;
			}
		});
	const daySensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const reorderDays = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		update((s) => {
			const from = s.days.findIndex((day) => day.id === active.id);
			const to = s.days.findIndex((day) => day.id === over.id);
			if (from >= 0 && to >= 0) s.days = arrayMove(s.days, from, to);
		});
	};

	return (
		<div className="mb-28">
			<Modal
				open={Boolean(validationMessage)}
				title="Program needs attention"
				description={validationMessage}
				onClose={() => setValidationMessage("")}
			>
				<DialogActions>
					<button
						className={primaryButton}
						onClick={() => setValidationMessage("")}
					>
						Review program
					</button>
				</DialogActions>
			</Modal>
			{!editingExercise && !editingDay && (
				<nav className="grid grid-cols-2 gap-1 rounded-2xl border border-black/10 bg-black/[.03] p-1 dark:border-white/10 dark:bg-white/[.06]">
					{tabs.map(({ id, label, Icon, count }) => (
						<button
							key={id}
							onClick={() => {
								setTab(id);
								setExpanded(null);
							}}
							className={`rounded-xl px-2 py-2.5 transition ${tab === id ? "bg-white text-black shadow-sm dark:bg-white dark:text-black" : "text-black/45 dark:text-white/45"}`}
						>
							<span className="flex items-center justify-center gap-1.5 text-xs font-semibold">
								<Icon size={14} />
								{label}
								<span className="font-normal opacity-50">{count}</span>
							</span>
						</button>
					))}
				</nav>
			)}
			<div className="mt-4 space-y-2">
				{tab === "plan" && !editingDay && (
					<DndContext sensors={daySensors} collisionDetection={closestCenter} onDragEnd={reorderDays}>
						<SortableContext items={draft.days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
							<div className="space-y-2">
								{draft.days.map((day, i) => (
									<SortableDayCard key={day.id} day={day} weekday={WEEKDAYS[i % 7]} isToday={i === todayDayIndex} onOpen={() => setExpanded(day.id)} />
								))}
							</div>
						</SortableContext>
					</DndContext>
				)}
				{false && tab === "plan" &&
					!editingDay &&
					draft.days.map((day, i) => (
						<button
							type="button"
							key={day.id}
							onClick={() => setExpanded(day.id)}
							className="flex w-full items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"
						>
							<span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-black/[.05] text-[9px] font-bold uppercase text-black/45 dark:bg-white/[.08] dark:text-white/45">
								{WEEKDAYS[i % 7].slice(0, 3)}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-semibold">
									{day.name || "Untitled day"}
								</span>
								<span className="mt-1 block truncate text-xs text-black/45 dark:text-white/45">
									{day.isRestDay
										? "Rest / recovery"
										: `${day.exerciseIds.length} exercises · ${day.warmup?.length ? `${day.warmup.length} warm-up steps` : "automatic warm-up"}`}
								</span>
							</span>
							<ChevronDown
								size={17}
								className="-rotate-90 text-black/35 dark:text-white/35"
							/>
						</button>
					))}
				{editingDay && (
					<section>
						<header className="mb-5 flex items-center justify-between">
							<button
								type="button"
								onClick={() => setExpanded(null)}
								className="flex items-center gap-1.5 text-sm font-semibold"
							>
								<ArrowLeft size={17} />
								Workout Plan
							</button>
							<button
								type="button"
								onClick={() => setExpanded(null)}
								className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
							>
								Done
							</button>
						</header>
						<div className="text-[10px] font-semibold uppercase tracking-widest text-black/40 dark:text-white/40">
							{
								WEEKDAYS[
									draft.days.findIndex((day) => day.id === editingDay.id) % 7
								]
							}
						</div>
						<input
							aria-label="Workout day name"
							className="mt-1 w-full border-0 border-b border-black/15 bg-transparent pb-2 text-2xl font-bold outline-none placeholder:text-black/30 focus:border-black dark:border-white/20 dark:placeholder:text-white/30 dark:focus:border-white"
							value={editingDay.name}
							placeholder={editingDay.isRestDay ? "Recovery" : "Push day"}
							onChange={(e) =>
								update((s) => {
									const day = s.days.find((day) => day.id === editingDay.id);
									if (day) day.name = e.target.value;
								})
							}
						/>
						<L>Day type</L>
						<NativeSelect
							value={editingDay.isRestDay ? "rest" : "training"}
							onChange={(value) =>
								update((s) => {
									const day = s.days.find((day) => day.id === editingDay.id);
									if (day) {
										day.isRestDay = value === "rest";
										if (day.isRestDay) {
											day.exerciseIds = [];
											delete day.warmup;
										}
									}
								})
							}
						>
							<option value="training">Training day</option>
							<option value="rest">Rest / recovery day</option>
						</NativeSelect>
						{!editingDay.isRestDay && (
							<>
								<L>Exercises</L>
								<MultiSelect
									label={
										exerciseOptions.length
											? "Choose exercises"
											: "Add exercises in the library first"
									}
									options={exerciseOptions}
									value={editingDay.exerciseIds}
									onChange={(ids) =>
										update((s) => {
											const day = s.days.find(
												(day) => day.id === editingDay.id,
											);
											if (day) day.exerciseIds = ids;
										})
									}
								/>
								<ExerciseOrder
									options={exerciseOptions}
									value={editingDay.exerciseIds}
									onChange={(ids) =>
										update((s) => {
											const day = s.days.find(
												(day) => day.id === editingDay.id,
											);
											if (day) day.exerciseIds = ids;
										})
									}
								/>
								<WarmupEditor
									steps={editingDay.warmup}
									suggestedAreas={suggestedAreas(editingDay)}
									onChange={(steps) => setDayWarmup(editingDay.id, steps)}
								/>
							</>
						)}
						{editingDay.isRestDay && (
							<div className="mt-4 rounded-xl bg-black/[.035] p-4 text-sm leading-relaxed text-black/50 dark:bg-white/[.06] dark:text-white/50">
								Rest days have no exercises or warm-up. Change the day type to
								Training day to configure them.
							</div>
						)}
					</section>
				)}
				{tab === "library" &&
					!editingExercise &&
					draft.exercises.map((ex) => (
						<button
							type="button"
							key={ex.id}
							onClick={() => setExpanded(ex.id)}
							className="flex w-full items-center gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"
						>
							<div className="min-w-0 flex-1">
								<div className="truncate font-semibold">
									{ex.name || "Untitled exercise"}
								</div>
								<div className="mt-1 text-xs text-black/45 dark:text-white/45">
									{ex.tracking === "timed"
										? `${ex.durationSeconds || 30} seconds × ${ex.sets || 3} sets`
										: `${ex.sets || 3} sets × ${ex.reps || "8–12"} reps`}
								</div>
							</div>
							<ChevronDown
								size={17}
								className="-rotate-90 text-black/35 dark:text-white/35"
							/>
						</button>
					))}
				{editingExercise && (
					<section>
						<header className="mb-5 flex items-center justify-between">
							<button
								type="button"
								onClick={() => setExpanded(null)}
								className="flex items-center gap-1.5 text-sm font-semibold"
							>
								<ArrowLeft size={17} />
								Library
							</button>
							<button
								type="button"
								onClick={() => setExpanded(null)}
								className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
							>
								Done
							</button>
						</header>
						<input
							aria-label="Exercise name"
							className="w-full border-0 border-b border-black/15 bg-transparent pb-2 text-2xl font-bold outline-none placeholder:text-black/30 focus:border-black dark:border-white/20 dark:placeholder:text-white/30 dark:focus:border-white"
							value={editingExercise.name}
							placeholder="New exercise"
							onChange={(e) =>
								update((s) => {
									const x = s.exercises.find(
										(x) => x.id === editingExercise.id,
									);
									if (x) x.name = e.target.value;
								})
							}
						/>
						<L>Muscle groups</L>
						<MultiSelect
							label="Choose at least one"
							options={groupOptions}
							value={
								editingExercise.muscleGroupIds ||
								draft.muscleGroups
									.filter((g) => g.exerciseIds.includes(editingExercise.id))
									.map((g) => g.id)
							}
							onChange={(ids) =>
								update((s) => {
									const x = s.exercises.find(
										(x) => x.id === editingExercise.id,
									);
									if (x) x.muscleGroupIds = ids;
									s.muscleGroups.forEach(
										(g) =>
											(g.exerciseIds = ids.includes(g.id)
												? [...new Set([...g.exerciseIds, editingExercise.id])]
												: g.exerciseIds.filter(
														(id) => id !== editingExercise.id,
													)),
									);
								})
							}
						/>
						<L>Tracking</L>
						<div className="grid grid-cols-2 gap-1 rounded-xl bg-black/[.05] p-1 dark:bg-white/[.08]">
							{(["reps", "timed"] as const).map((mode) => (
								<button
									type="button"
									key={mode}
									onClick={() =>
										update((s) => {
											const x = s.exercises.find(
												(x) => x.id === editingExercise.id,
											);
											if (x) x.tracking = mode;
										})
									}
									className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${(editingExercise.tracking || "reps") === mode ? "bg-white shadow-sm dark:bg-white dark:text-black" : "text-black/45 dark:text-white/45"}`}
								>
									{mode === "reps" ? "Reps" : "Timed"}
								</button>
							))}
						</div>
						<div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
							<div>
								<L>Sets</L>
								<input
									className={field}
									type="number"
									min="1"
									value={editingExercise.sets || ""}
									onChange={(e) =>
										update((s) => {
											const x = s.exercises.find(
												(x) => x.id === editingExercise.id,
											);
											if (x) x.sets = Number(e.target.value) || undefined;
										})
									}
								/>
							</div>
							<span className="pb-3 text-sm text-black/35 dark:text-white/35">
								×
							</span>
							<div>
								<L>
									{editingExercise.tracking === "timed" ? "Seconds" : "Reps"}
								</L>
								<input
									className={field}
									type={
										editingExercise.tracking === "timed" ? "number" : "text"
									}
									min="1"
									value={
										editingExercise.tracking === "timed"
											? editingExercise.durationSeconds || ""
											: editingExercise.reps || ""
									}
									placeholder={
										editingExercise.tracking === "timed" ? "30" : "8–12"
									}
									onChange={(e) =>
										update((s) => {
											const x = s.exercises.find(
												(x) => x.id === editingExercise.id,
											);
											if (!x) return;
											if (x.tracking === "timed")
												x.durationSeconds = Number(e.target.value) || undefined;
											else x.reps = e.target.value;
										})
									}
								/>
							</div>
						</div>
						<L>Instructions</L>
						<textarea
							className={`${field} min-h-24 resize-y`}
							value={editingExercise.instructions || ""}
							placeholder="Setup, movement and useful cues…"
							onChange={(e) =>
								update((s) => {
									const x = s.exercises.find(
										(x) => x.id === editingExercise.id,
									);
									if (x) x.instructions = e.target.value;
								})
							}
						/>
						<details className="mt-5 rounded-xl border border-black/10 p-3 dark:border-white/15">
							<summary className="cursor-pointer text-sm font-semibold text-black/60 dark:text-white/60">
								Optional details
							</summary>
							<L>Common mistakes</L>
							<textarea
								className={`${field} min-h-20 resize-y`}
								value={editingExercise.commonMistakes || ""}
								placeholder="What should someone avoid doing?"
								onChange={(e) =>
									update((s) => {
										const x = s.exercises.find(
											(x) => x.id === editingExercise.id,
										);
										if (x) x.commonMistakes = e.target.value;
									})
								}
							/>
							<L>Equipment</L>
							<input
								className={field}
								value={editingExercise.equipment || ""}
								placeholder="e.g. Barbell"
								onChange={(e) =>
									update((s) => {
										const x = s.exercises.find(
											(x) => x.id === editingExercise.id,
										);
										if (x) x.equipment = e.target.value;
									})
								}
							/>
						</details>
						<button
							type="button"
							onClick={() => {
								removeExercise(editingExercise.id);
								setExpanded(null);
							}}
							className="mt-6 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
						>
							<Trash2 size={14} />
							Delete exercise
						</button>
					</section>
				)}
				{(tab === "plan" ? draft.days : draft.exercises).length === 0 && (
					<div className="rounded-2xl border border-dashed border-black/20 px-5 py-10 text-center dark:border-white/20">
						<div className="text-sm font-semibold">Nothing here yet</div>
						<div className="mt-1 text-xs text-black/45 dark:text-white/45">
							Add an exercise to get started.
						</div>
					</div>
				)}
			</div>
			{tab === "library" && !editingExercise && (
				<button
					onClick={addExercise}
					className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black px-3 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
				>
					<Plus size={16} />
					Add exercise
				</button>
			)}
			{dirty && (
				<div className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 gap-2 border-t border-black/10 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur dark:border-white/15 dark:bg-black/95">
					<button
						className="flex-1 rounded-xl border border-black/15 py-3 text-sm font-semibold dark:border-white/20"
						onClick={() => {
							setDraft(clone(state));
							setExpanded(null);
						}}
					>
						Discard
					</button>
					<button
						className="flex-[1.4] rounded-xl bg-black py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
						onClick={saveDraft}
					>
						Save program
					</button>
				</div>
			)}
		</div>
	);
}

function L({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-1 mt-3 block text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
			{children}
		</label>
	);
}
function WarmupEditor({
	steps,
	suggestedAreas,
	onChange,
}: {
	steps?: WarmupStep[];
	suggestedAreas: string[];
	onChange: (steps: WarmupStep[] | undefined) => void;
}) {
	const [editing, setEditing] = useState<number | null>(null);
	const add = () => {
		onChange([...(steps || []), { name: "", amount: "", detail: "" }]);
		setEditing(steps?.length || 0);
	};
	const updateStep = (index: number, patch: Partial<WarmupStep>) =>
		onChange(
			(steps || []).map((step, i) =>
				i === index ? { ...step, ...patch } : step,
			),
		);
	const remove = (index: number) => {
		const next = (steps || []).filter((_, i) => i !== index);
		onChange(next.length ? next : undefined);
		setEditing(null);
	};
	const applyPreset = (areas: string[]) => {
		onChange(warmupStepsFor(areas));
		setEditing(null);
	};
	return (
		<section className="mt-5 overflow-hidden rounded-2xl border border-black/10 dark:border-white/15">
			<header className="p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold">Warm-up</h3>
						<p className="mt-0.5 text-xs text-black/45 dark:text-white/45">
							{steps?.length
								? `${steps.length} saved movements`
								: `Automatic · ${suggestedAreas.join(" + ")}`}
						</p>
					</div>
					{steps?.length ? (
						<button
							type="button"
							onClick={() => {
								onChange(undefined);
								setEditing(null);
							}}
							className="text-xs font-semibold text-black/50 dark:text-white/50"
						>
							Use automatic
						</button>
					) : null}
				</div>
			</header>
			<div className="border-t border-black/10 p-3 dark:border-white/10">
				{!steps?.length ? (
					<div className="rounded-xl bg-black/[.035] p-3 dark:bg-white/[.06]">
						<b className="block text-sm">Automatic builder</b>
						<p className="mt-1 text-xs leading-relaxed text-black/50 dark:text-white/50">
							At workout time, areas are suggested from this day’s exercises and
							can be adjusted before starting.
						</p>
						<button
							type="button"
							onClick={() => applyPreset(suggestedAreas)}
							className="mt-3 w-full rounded-xl bg-black py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
						>
							Save recommended routine
						</button>
					</div>
				) : (
					<div className="space-y-2">
						{steps.map((step, index) => {
							const open = editing === index;
							return (
								<div
									key={index}
									className={`overflow-hidden rounded-xl border ${open ? "border-black/25 dark:border-white/30" : "border-black/10 dark:border-white/10"}`}
								>
									<button
										type="button"
										onClick={() => setEditing(open ? null : index)}
										className="flex w-full items-center gap-3 p-3 text-left"
									>
										<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[.06] text-xs font-semibold dark:bg-white/[.09]">
											{index + 1}
										</span>
										<span className="min-w-0 flex-1">
											<b className="block truncate text-sm">
												{step.name || "New movement"}
											</b>
											<span className="block truncate text-xs text-black/45 dark:text-white/45">
												{step.amount || "No amount set"}
											</span>
										</span>
										<ChevronDown
											size={16}
											className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
										/>
									</button>
									{open && (
										<div className="border-t border-black/10 p-3 dark:border-white/10">
											<L>Movement</L>
											<input
												autoFocus
												aria-label={`Warm-up step ${index + 1} name`}
												className={field}
												value={step.name}
												placeholder="e.g. Arm circles"
												onChange={(e) =>
													updateStep(index, { name: e.target.value })
												}
											/>
											<L>Reps or time</L>
											<input
												aria-label={`Warm-up step ${index + 1} amount`}
												className={field}
												value={step.amount}
												placeholder="e.g. 10 reps or 30 sec"
												onChange={(e) =>
													updateStep(index, { amount: e.target.value })
												}
											/>
											<L>Instructions (optional)</L>
											<textarea
												aria-label={`Warm-up step ${index + 1} instructions`}
												className={`${field} min-h-20 resize-y`}
												value={step.detail}
												placeholder="A short setup or movement cue"
												onChange={(e) =>
													updateStep(index, { detail: e.target.value })
												}
											/>
											<button
												type="button"
												onClick={() => remove(index)}
												className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400"
											>
												Remove movement
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
				<div className="mt-3 grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={add}
						className="flex items-center justify-center gap-1 rounded-xl border border-black/15 py-2.5 text-xs font-semibold dark:border-white/20"
					>
						<Plus size={14} />
						Add movement
					</button>
					<select
						aria-label="Apply warm-up preset"
						value=""
						onChange={(e) => {
							if (e.target.value === "recommended") applyPreset(suggestedAreas);
							else if (e.target.value) applyPreset([e.target.value]);
						}}
						className={`${field} py-2.5 text-xs font-semibold`}
					>
						<option value="">Choose preset…</option>
						<option value="recommended">Recommended</option>
						{WARMUP_AREAS.map((area) => (
							<option key={area} value={area}>
								{area}
							</option>
						))}
					</select>
				</div>
			</div>
		</section>
	);
}
