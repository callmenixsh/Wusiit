import React from "react";
import {
	Check,
	CheckCircle2,
	ChevronDown,
	Pause,
	Play,
	SkipForward,
	Vibrate,
	Volume2,
	X,
} from "lucide-react";
import { AppState, DayEntry, WorkoutRating } from "../lib/storage";
import { getWeeklyStats } from "../lib/history";
import {
	DEFAULT_WARMUP_STEPS,
	WarmupStep,
	warmupStepsFor,
	WARMUP_AREAS,
} from "../lib/warmup";

type SetRating = "hard" | "right" | "easy";
type WarmupStage = "choice" | "areas" | "steps" | null;
type Props = {
	state: AppState;
	dayIndex: number;
	onMark: () => void;
	onDoTomorrow: () => void;
	onFinishWorkout: () => void;
	onEndWorkout: () => void;
	isWorkoutActive: boolean;
	elapsedWorkoutSeconds: number;
	isWorkoutPaused: boolean;
	onToggleWorkoutPause: () => void;
	exerciseSecondsRemaining: number;
	restSecondsRemaining: number;
	isResting: boolean;
	restNextExerciseId: string;
	onSkipRest: () => void;
	onExtendRest: () => void;
	onToggleRestSound: () => void;
	onToggleRestVibration: () => void;
	activeExerciseId: string;
	activeSet: number;
	completedExerciseIds: string[];
	onSelectExercise: (id: string) => void;
	ratingExerciseId: string | null;
	onCompleteExercise: (id: string) => void;
	onRateExercise: (rating: SetRating) => void;
	lastWorkoutDate: string;
	completedToday?: DayEntry;
	onStartNextWorkoutToday: () => void;
	warmupStage: WarmupStage;
	warmupAreas: string[];
	completedWarmupSteps: number[];
	onToggleWarmupStep: (index: number) => void;
	onChooseWarmup: () => void;
	onToggleWarmupArea: (area: string) => void;
	onShowWarmupSteps: () => void;
	onBeginExercises: () => void;
};
const clock = (s: number) =>
	`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const dateLabel = (v: string) =>
	v
		? new Date(`${v}T00:00:00`).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			})
		: "Never";
const ratingLabel = (rating: WorkoutRating | undefined) =>
	rating === "challenging"
		? "Challenging"
		: rating === "easy"
			? "Could progress"
			: rating === "balanced"
				? "Well balanced"
				: "Not rated";

const instructionLines = (text: string) =>
	text
		.split(/\r?\n|(?<=[.!?])\s+/)
		.map((line) => line.trim())
		.filter(Boolean);

function InstructionLines({ text, className = "", ordered = false }: {
	text: string;
	className?: string;
	ordered?: boolean;
}) {
	const lines = instructionLines(text);
	const List = ordered ? "ol" : "ul";
	return (
		<List className={`${ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-5 ${className}`}>
			{lines.map((line, index) => (
				<li key={`${index}-${line}`} className="pl-0.5">{line}</li>
			))}
		</List>
	);
}

export default function TodayCard(p: Props) {
	const {
		state,
		dayIndex,
		onMark,
		onDoTomorrow,
		onFinishWorkout,
		onEndWorkout,
		isWorkoutActive,
		elapsedWorkoutSeconds,
		isWorkoutPaused,
		onToggleWorkoutPause,
		exerciseSecondsRemaining,
		restSecondsRemaining,
		isResting,
		restNextExerciseId,
		onSkipRest,
		onExtendRest,
		onToggleRestSound,
		onToggleRestVibration,
		activeExerciseId,
		activeSet,
		completedExerciseIds,
		onSelectExercise,
		ratingExerciseId,
		onCompleteExercise,
		onRateExercise,
		lastWorkoutDate,
		completedToday,
		onStartNextWorkoutToday,
		warmupStage,
		warmupAreas,
		completedWarmupSteps,
		onToggleWarmupStep,
		onChooseWarmup,
		onToggleWarmupArea,
		onShowWarmupSteps,
		onBeginExercises,
	} = p;
	const day = state.days[dayIndex];
	if (!day)
		return <div className="rounded-xl border p-5">No plan configured.</div>;
	const ids = [...new Set(day.exerciseIds)];
	const exercises = ids
		.map((id) => state.exercises.find((e) => e.id === id))
		.filter(Boolean);
	const usedGroupIds = new Set(
		exercises.flatMap((ex) => ex?.muscleGroupIds || []),
	);
	const groups = state.muscleGroups.filter((group) =>
		usedGroupIds.has(group.id),
	);
	const active = state.exercises.find((e) => e.id === activeExerciseId);
	const activeRecent = active
		? state.history
				.flatMap((entry) => entry.performances || [])
				.find((item) => item.exerciseId === active.id)
		: undefined;
	const ratingExercise = state.exercises.find((e) => e.id === ratingExerciseId);
	const restNextExercise = state.exercises.find(
		(e) => e.id === restNextExerciseId,
	);
	const done = ids.filter((id) => completedExerciseIds.includes(id)).length;
	const progress = ids.length ? (done / ids.length) * 100 : 0;

	if (completedToday && !isWorkoutActive) {
		const streak = getWeeklyStats(state.history, state.weeklyWorkoutGoal);
		const nextDay = state.days[(dayIndex + 1) % state.days.length];
		return (
			<section className="overflow-hidden rounded-2xl bg-black text-white dark:bg-white dark:text-black">
				<div className="p-6">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 dark:bg-black/10">
						<Check size={30} />
					</div>
					<div className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] opacity-45">
						Completed today
					</div>
					<h2 className="mt-2 text-4xl font-black leading-none">
						{completedToday.label}
					</h2>
					<div className="mt-5 grid grid-cols-3 gap-2 text-center">
						<SummaryStat
							label="Time"
							value={
								completedToday.durationSeconds !== undefined
									? clock(completedToday.durationSeconds)
									: "—"
							}
						/>
						<SummaryStat
							label="Effort"
							value={ratingLabel(completedToday.rating)}
						/>
						<SummaryStat
							label="Week"
							value={`${streak.thisWeek}/${streak.goal}`}
						/>
					</div>
					{streak.currentStreak > 0 && (
						<p className="mt-4 text-center text-xs opacity-55">
							{streak.currentStreak} week consistency streak
						</p>
					)}
				</div>
				{nextDay && (
					<div className="border-t border-white/15 p-4 dark:border-black/15">
						<div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
							Up next
						</div>
						<div className="mt-1 text-lg font-bold">{nextDay.name}</div>
						<button
							onClick={onStartNextWorkoutToday}
							className="mt-3 w-full rounded-xl border border-current/20 py-3 text-sm font-semibold"
						>
							{nextDay.isRestDay ? "View next day" : "Start next workout now"}
						</button>
					</div>
				)}
			</section>
		);
	}

	if (day.isRestDay)
		return (
			<section className="flex min-h-[55vh] flex-col justify-between rounded-2xl border border-black/15 p-6 dark:border-white/20">
				<div>
					<div className="text-[10px] font-semibold uppercase tracking-[.2em] opacity-45">
						Today's plan
					</div>
					<h2 className="mt-3 text-5xl font-black leading-none">
						{day.name || "Rest day"}
					</h2>
					<p className="mt-4 max-w-sm text-sm leading-relaxed opacity-55">
						Recovery is part of the program. Take it easy, stay hydrated, and
						add some gentle mobility or walking if it feels good.
					</p>
				</div>
				<div>
					<div className="mb-4 grid grid-cols-2 gap-2 text-center text-xs">
						<div className="rounded-xl bg-black/[.04] p-3 dark:bg-white/[.07]">
							<b className="block text-lg">7–9h</b>
							<span className="opacity-45">Sleep</span>
						</div>
						<div className="rounded-xl bg-black/[.04] p-3 dark:bg-white/[.07]">
							<b className="block text-lg">Easy</b>
							<span className="opacity-45">Movement</span>
						</div>
					</div>
					<button
						onClick={onDoTomorrow}
						className="w-full rounded-xl bg-black py-3 font-semibold text-white dark:bg-white dark:text-black"
					>
						Move to tomorrow
					</button>
				</div>
			</section>
		);

	if (isWorkoutActive)
		return (
			<div className="fixed inset-0 z-40 flex h-[100dvh] flex-col overflow-hidden bg-neutral-950 text-white">
				<header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]">
					<div className="min-w-0">
						<div className="truncate text-[10px] font-bold uppercase tracking-[.22em] text-white/40">
							{day.name}
						</div>
						<div className="mt-1 text-sm text-white/75">
							{warmupStage
								? "Getting ready"
								: `Exercise ${Math.min(done + 1, ids.length)} of ${ids.length}`}
						</div>
					</div>
					<div className="ml-auto flex items-center gap-2">
						<button
							onClick={onToggleWorkoutPause}
							aria-label={isWorkoutPaused ? "Resume workout" : "Pause workout"}
							className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2"
						>
							<span className="font-mono text-sm font-semibold tabular-nums">
								{clock(elapsedWorkoutSeconds)}
							</span>
							{isWorkoutPaused ? (
								<Play size={16} fill="currentColor" />
							) : (
								<Pause size={16} fill="currentColor" />
							)}
						</button>
						<button
							onClick={onEndWorkout}
							aria-label="Cancel workout"
							className="rounded-full border border-white/15 bg-white/5 p-2.5"
						>
							<X size={19} />
						</button>
					</div>
				</header>
				<div className="mx-5 h-1 shrink-0 overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-white transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<main className="scroll-dark flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
					{warmupStage ? (
						<WarmupFlow
							stage={warmupStage}
							customSteps={day.warmup || []}
							areas={warmupAreas}
							completed={completedWarmupSteps}
							paused={isWorkoutPaused}
							onChooseWarmup={onChooseWarmup}
							onToggleArea={onToggleWarmupArea}
							onShowSteps={onShowWarmupSteps}
							onToggleStep={onToggleWarmupStep}
							onBeginExercises={onBeginExercises}
						/>
					) : (
						<>
							{isResting ? (
								<section className="my-auto flex flex-col items-center py-8 text-center">
									<div className="text-[10px] font-bold uppercase tracking-[.28em] text-white/40">
										Rest timer
									</div>
									<div className="mt-3 font-mono text-[clamp(5rem,28vw,9rem)] font-black leading-none tracking-[-.08em] tabular-nums">
										{clock(restSecondsRemaining)}
									</div>
									<div className="mt-5 rounded-2xl border border-white/10 bg-white/[.05] px-5 py-3">
										<div className="text-[9px] font-bold uppercase tracking-widest text-white/35">
											Up next
										</div>
										<div className="mt-1 text-lg font-semibold">
											{restNextExercise?.name || "Next set"}
										</div>
									</div>
									<div className="mt-7 grid grid-cols-2 gap-2">
										<button
											disabled={isWorkoutPaused}
											onClick={onExtendRest}
											className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold disabled:opacity-35"
										>
											+30 sec
										</button>
										<button
											disabled={isWorkoutPaused}
											onClick={onSkipRest}
											className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-35"
										>
											Skip rest
										</button>
									</div>
									<div className="mt-4 flex gap-2">
										<button
											onClick={onToggleRestSound}
											aria-pressed={state.restTimerSound}
											className={`rounded-full border p-3 ${state.restTimerSound ? "border-white bg-white text-black" : "border-white/20 text-white/40"}`}
											aria-label="Toggle rest timer sound"
										>
											<Volume2 size={17} />
										</button>
										<button
											onClick={onToggleRestVibration}
											aria-pressed={state.restTimerVibration}
											className={`rounded-full border p-3 ${state.restTimerVibration ? "border-white bg-white text-black" : "border-white/20 text-white/40"}`}
											aria-label="Toggle rest timer vibration"
										>
											<Vibrate size={17} />
										</button>
									</div>
									{isWorkoutPaused && (
										<div className="mt-3 text-xs text-white/45">
											Resume workout to continue
										</div>
									)}
								</section>
							) : active ? (
								<>
									<div className="flex flex-1 flex-col justify-center py-3 text-center">
										{active.tracking === "timed" ? (
											<>
												<div className="text-[10px] font-bold uppercase tracking-[.24em] text-white/35">
													Set {activeSet} of {active.sets || 1}
												</div>
												<div className="mt-1 font-mono text-[clamp(3.75rem,21vw,7rem)] font-black leading-none tracking-[-.08em] text-white tabular-nums">
													{clock(exerciseSecondsRemaining)}
												</div>
												<div className="mt-2 text-[11px] text-white/30">
													{isWorkoutPaused
														? "Workout paused"
														: `Workout elapsed · ${clock(elapsedWorkoutSeconds)}`}
												</div>
											</>
										) : (
											<div className="text-[11px] font-bold uppercase tracking-[.24em] text-white/60">
												{isWorkoutPaused ? "Paused · " : ""}Set {activeSet} of{" "}
												{active.sets || 1}
											</div>
										)}
										<section className="mx-auto mt-5 w-full max-w-md rounded-3xl border border-white/10 bg-white/[.06] p-5">
											<h2 className="text-3xl font-bold leading-tight">
												{active.name}
											</h2>
											<div className="mt-2 font-semibold text-white/75">
												{active.tracking === "timed"
													? `${active.durationSeconds || 30}s × ${active.sets || 3} sets`
													: `${active.sets || 3} sets × ${active.reps || "8–12"}`}
												{active.equipment ? ` · ${active.equipment}` : ""}
											</div>
											{activeRecent && (
												<div className="mt-3 rounded-xl bg-white/[.06] px-3 py-2 text-xs text-white/60">
													Last performance:{" "}
													{activeRecent.weight !== undefined
														? `${activeRecent.weight} kg × `
														: ""}
													{activeRecent.reps ??
														(activeRecent.durationSeconds
															? `${activeRecent.durationSeconds}s`
															: "")}
												</div>
											)}
											{active.instructions && (
												<InstructionLines text={active.instructions} ordered className="mt-4 text-left text-sm leading-relaxed text-white/55" />
											)}
										</section>
										{active.commonMistakes && (
											<div className="mx-auto mt-3 w-full max-w-md rounded-2xl border border-white/10 px-4 py-3 text-left">
												<div className="text-[9px] font-bold uppercase tracking-widest text-white/35">
													Avoid
												</div>
												<InstructionLines text={active.commonMistakes} className="mt-1 text-xs leading-relaxed text-white/55" />
											</div>
										)}
									</div>
									<button
										disabled={isWorkoutPaused}
										onClick={() => onCompleteExercise(active.id)}
										className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
									>
										<CheckCircle2 size={20} />
										{isWorkoutPaused
											? "Resume to continue"
											: activeSet < (active.sets || 1)
												? "Complete set"
												: "Complete final set"}
									</button>
								</>
							) : (
								<section className="my-auto w-full max-w-md self-center py-6 text-center">
									<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white">
										<Check size={40} />
									</div>
									<h2 className="mt-5 text-4xl font-black">Workout complete</h2>
									<p className="mt-2 text-white/45">
										{clock(elapsedWorkoutSeconds)} active time
									</p>
									<button
										onClick={onFinishWorkout}
										className="mt-7 w-full rounded-2xl bg-white py-4 text-lg font-bold text-black"
									>
										Save workout
									</button>
								</section>
							)}
							<div className="mt-3 flex shrink-0 gap-2 overflow-x-auto py-1">
								{exercises.map((ex, i) => {
									const finished = completedExerciseIds.includes(ex!.id),
										selected = ex!.id === activeExerciseId;
									return (
										<button
											key={ex!.id}
											disabled={finished || isResting || isWorkoutPaused}
											onClick={() => onSelectExercise(ex!.id)}
											className={`min-w-[116px] rounded-xl border px-3 py-2.5 text-left ${selected ? "border-white bg-white/10" : "border-white/10 bg-white/[.03]"} ${finished || isResting ? "opacity-30" : ""}`}
										>
											<div
												className={`text-[9px] font-bold uppercase tracking-wider ${selected ? "text-white" : "text-white/35"}`}
											>
												{finished ? "Completed" : `Exercise ${i + 1}`}
											</div>
											<div className="mt-1 truncate text-sm font-semibold">
												{ex!.name}
											</div>
										</button>
									);
								})}
							</div>
						</>
					)}
				</main>
				{ratingExercise && (
					<div className="absolute inset-0 z-10 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center">
						<div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-5 shadow-2xl">
							<div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/55">
								Set {activeSet} complete
							</div>
							<h3 className="mt-2 text-2xl font-bold">How did it feel?</h3>
							<p className="mt-1 text-sm text-white/45">
								This adjusts {ratingExercise.name} for this plan.
							</p>
							<div className="mt-5 grid grid-cols-3 gap-2">
								<SetRatingButton
									label="Too hard"
									note={
										ratingExercise.tracking === "timed" ? "−5 sec" : "−2 reps"
									}
									onClick={() => onRateExercise("hard")}
								/>
								<SetRatingButton
									label="Just right"
									note="No change"
									primary
									onClick={() => onRateExercise("right")}
								/>
								<SetRatingButton
									label="Too easy"
									note={
										ratingExercise.tracking === "timed" ? "+5 sec" : "+2 reps"
									}
									onClick={() => onRateExercise("easy")}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);

	return (
		<div className="mb-3 space-y-3">
			<section className="overflow-hidden rounded-2xl bg-black text-white dark:bg-white dark:text-black">
				<div className="p-6">
					<div className="flex justify-between gap-3 text-[10px] uppercase tracking-widest opacity-50">
						<span>Today's session</span>
						<span className="shrink-0">{ids.length} exercises</span>
					</div>
					<h2 className="mt-3 break-words text-5xl font-black leading-none">
						{day.name}
					</h2>
					{groups.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-1.5">
							{groups.map((g) => (
								<span
									key={g!.id}
									className="max-w-full truncate rounded-full border border-current/20 px-2.5 py-1 text-xs"
								>
									{g!.name}
								</span>
							))}
						</div>
					)}
				</div>
				<div className="grid grid-cols-[1fr_auto] gap-2 border-t border-white/15 p-3 dark:border-black/15">
					<button
						onClick={onMark}
						className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black dark:bg-black dark:text-white"
					>
						<CheckCircle2 size={18} />
						Start workout
					</button>
					<button
						onClick={onDoTomorrow}
						className="rounded-xl border border-current/20 px-4"
					>
						<SkipForward size={18} />
					</button>
				</div>
			</section>
			<section className="rounded-2xl border border-black/15 p-4 dark:border-white/20">
				<div className="mb-3 flex justify-between">
					<div>
						<div className="text-[10px] uppercase tracking-widest opacity-45">
							Workout
						</div>
						<h3 className="font-semibold">Exercise list</h3>
					</div>
					<div className="text-right text-[10px] opacity-45">
						Last workout
						<br />
						<b>{dateLabel(lastWorkoutDate)}</b>
					</div>
				</div>
				<div className="border-t border-black/10 pt-3 dark:border-white/10">
					{exercises.map((ex, i) => {
						if (!ex) return null;
						const exerciseGroups = groups.filter((group) =>
							group!.exerciseIds.includes(ex.id),
						);
						return (
							<details
								key={ex.id}
								className="group mb-2 rounded-xl bg-black/[.035] dark:bg-white/[.07]"
							>
								<summary className="flex cursor-pointer list-none items-center gap-3 p-3">
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/10 text-xs">
										{i + 1}
									</span>
									<span className="min-w-0 flex-1">
										<b className="block truncate text-sm">{ex.name}</b>
										<span className="text-xs opacity-45">
											{ex.tracking === "timed"
												? `${ex.durationSeconds || 30}s × ${ex.sets || 3} sets`
												: `${ex.sets || 3} sets × ${ex.reps || "8–12"}`}
										</span>
										<span className="mt-1.5 flex flex-wrap gap-1">
											{exerciseGroups.map((group) => (
												<span
													key={group!.id}
													className="rounded-full border border-current/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-60"
												>
													{group!.name}
												</span>
											))}
										</span>
									</span>
									{ex.instructions && (
										<ChevronDown size={16} className="shrink-0" />
									)}
								</summary>
								{ex.instructions && (
									<div className="border-t border-current/10 p-3">
										<InstructionLines text={ex.instructions} ordered className="text-sm leading-relaxed opacity-60" />
									</div>
								)}
							</details>
						);
					})}
				</div>
			</section>
		</div>
	);
}

function SetRatingButton({
	label,
	note,
	primary,
	onClick,
}: {
	label: string;
	note: string;
	primary?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`rounded-2xl border p-3 text-center ${primary ? "border-white bg-white/10" : "border-white/10 bg-white/5"}`}
		>
			<b className="block text-sm">{label}</b>
			<span
				className={`mt-1 block text-[10px] ${primary ? "text-white/70" : "text-white/40"}`}
			>
				{note}
			</span>
		</button>
	);
}

function WarmupFlow({
	stage,
	customSteps,
	areas,
	completed,
	paused,
	onChooseWarmup,
	onToggleArea,
	onShowSteps,
	onToggleStep,
	onBeginExercises,
}: {
	stage: Exclude<WarmupStage, null>;
	customSteps: WarmupStep[];
	areas: string[];
	completed: number[];
	paused: boolean;
	onChooseWarmup: () => void;
	onToggleArea: (area: string) => void;
	onShowSteps: () => void;
	onToggleStep: (index: number) => void;
	onBeginExercises: () => void;
}) {
	const areaSteps = warmupStepsFor(areas);
	if (customSteps.length || stage === "steps") {
		const steps = customSteps.length
			? customSteps
			: areaSteps.length
				? areaSteps
				: DEFAULT_WARMUP_STEPS;
		return (
			<WarmupPhase
				steps={steps}
				completed={completed}
				paused={paused}
				onToggle={onToggleStep}
				onFinish={onBeginExercises}
			/>
		);
	}
	if (stage === "areas")
		return (
			<section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-5">
				<div className="text-[10px] font-bold uppercase tracking-[.24em] text-white/40">
					Recommended for this workout
				</div>
				<h2 className="mt-2 text-4xl font-black">Build your warm-up</h2>
				<p className="mt-2 text-sm text-white/45">
					Areas from today's exercises is selected, adjust if needed.
				</p>
				<div className="mt-6 grid grid-cols-2 gap-2">
					{WARMUP_AREAS.map((area) => {
						const picked = areas.includes(area);
						return (
							<button
								type="button"
								disabled={paused}
								aria-pressed={picked}
								key={area}
								onClick={() => onToggleArea(area)}
								className={`rounded-2xl border px-3 py-4 text-sm font-semibold disabled:opacity-40 ${picked ? "border-white bg-white text-black" : "border-white/10 bg-white/[.03] text-white/80"}`}
							>
								{area}
							</button>
						);
					})}
				</div>
				<div className="mt-3 text-center text-xs text-white/35">
					{areaSteps.length
						? `${areaSteps.length} movements · about ${Math.max(2, Math.ceil(areaSteps.length * 0.6))} minutes`
						: "Select at least one area"}
				</div>
				<div className="mt-5 flex gap-2">
					<button
						disabled={paused}
						onClick={onBeginExercises}
						className="flex-1 rounded-2xl border border-white/20 py-4 text-sm font-semibold text-white/70 disabled:opacity-40"
					>
						Skip
					</button>
					<button
						disabled={paused || areaSteps.length === 0}
						onClick={onShowSteps}
						className="flex-1 rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40"
					>
						Start warm-up
					</button>
				</div>
			</section>
		);
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-5">
			<div className="text-[10px] font-bold uppercase tracking-[.24em] text-white/40">
				Before you lift
			</div>
			<h2 className="mt-2 text-4xl font-black">Warm up first</h2>
			<button
				disabled={paused}
				onClick={onChooseWarmup}
				className="mt-7 w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40"
			>
				{customSteps.length ? "Show my warm-up" : "Build a warm-up"}
			</button>
			<button
				disabled={paused}
				onClick={onBeginExercises}
				className="mt-2 w-full rounded-2xl border border-white/20 py-4 text-sm font-semibold text-white/70 disabled:opacity-40"
			>
				Skip warm-up
			</button>
		</section>
	);
}

function WarmupPhase({
	steps,
	completed,
	paused,
	onToggle,
	onFinish,
}: {
	steps: WarmupStep[];
	completed: number[];
	paused: boolean;
	onToggle: (index: number) => void;
	onFinish: () => void;
}) {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-5">
			<div className="text-[10px] font-bold uppercase tracking-[.24em] text-white/40">
				Prepare to train
			</div>
			<h2 className="mt-2 text-4xl font-black">Warm-up</h2>
			<div className="mt-6 space-y-2">
				{steps.map((step, index) => {
					const done = completed.includes(index);
					return (
						<button
							type="button"
							disabled={paused}
							key={`${step.name}-${index}`}
							onClick={() => onToggle(index)}
							className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left disabled:opacity-40 ${done ? "border-white/25 bg-white/10" : "border-white/10 bg-white/[.03]"}`}
						>
							<span
								className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${done ? "border-white bg-white text-black" : "border-white/25"}`}
							>
								{done && <Check size={14} />}
							</span>
							<span className="min-w-0 flex-1">
								<span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
									<span
										className={`text-sm font-medium ${done ? "text-white/45 line-through" : "text-white/90"}`}
									>
										{step.name}
									</span>
									{step.amount && (
										<span
											className={`shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums ${done ? "text-white/35" : "text-white/60"}`}
										>
											{step.amount}
										</span>
									)}
								</span>
								{step.detail && (
									<span
										className={`mt-1 block text-xs leading-relaxed ${done ? "text-white/25" : "text-white/45"}`}
									>
										{step.detail}
									</span>
								)}
							</span>
						</button>
					);
				})}
			</div>
			<button
				disabled={paused}
				onClick={onFinish}
				className="mt-6 w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40"
			>
				{completed.length === steps.length ? "Begin workout" : "Skip warm-up"}
			</button>
		</section>
	);
}
function SummaryStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-white/[.07] p-3 dark:bg-black/[.07]">
			<div className="text-[9px] font-bold uppercase tracking-wider opacity-40">
				{label}
			</div>
			<div className="mt-1 truncate text-sm font-bold">{value}</div>
		</div>
	);
}
