import React from "react";
import TodayCard from "../components/TodayCard";
import { AppState, DayEntry } from "../lib/storage";
import { localDateString } from "../lib/dates";

type HomeProps = {
	state: AppState;
	dayIndex: number;
	onStartWorkout: () => void;
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
	onRateExercise: (rating: "hard" | "right" | "easy") => void;
	lastWorkoutDate: string;
	completedToday?: DayEntry;
	onStartNextWorkoutToday: () => void;
	onRequestWeight: () => void;
	warmupStage: "choice" | "areas" | "steps" | null;
	warmupAreas: string[];
	completedWarmupSteps: number[];
	onToggleWarmupStep: (index: number) => void;
	onChooseWarmup: () => void;
	onToggleWarmupArea: (area: string) => void;
	onShowWarmupSteps: () => void;
	onBeginExercises: () => void;
};

export default function Home({
	state,
	dayIndex,
	onStartWorkout,
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
	onRequestWeight,
	warmupStage,
	warmupAreas,
	completedWarmupSteps,
	onToggleWarmupStep,
	onChooseWarmup,
	onToggleWarmupArea,
	onShowWarmupSteps,
	onBeginExercises,
}: HomeProps) {
	const latestWeight = state.weightTracking.entries[0];
	const daysSinceWeight = latestWeight
		? Math.floor(
				(new Date(`${localDateString()}T00:00:00`).getTime() -
					new Date(`${latestWeight.date}T00:00:00`).getTime()) /
					86400000,
			)
		: Infinity;
	const showWeightReminder =
		state.weightTracking.enabled && daysSinceWeight >= 7;

	return (
		<div className="space-y-3">
			{showWeightReminder && (
				<section className="rounded-lg border border-black/15 dark:border-white/20 p-3 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-3">
					<div>
						<div className="text-sm font-medium text-black dark:text-white">
							Weekly weigh-in
						</div>
						<div className="text-xs text-black/60 dark:text-white/60 mt-0.5">
							Keep your weight trend up to date.
						</div>
					</div>
					<button
						className="shrink-0 rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-xs font-medium"
						onClick={onRequestWeight}
					>
						Log weight
					</button>
				</section>
			)}
			<TodayCard
				state={state}
				dayIndex={dayIndex}
				onMark={onStartWorkout}
				onDoTomorrow={onDoTomorrow}
				onFinishWorkout={onFinishWorkout}
				onEndWorkout={onEndWorkout}
				isWorkoutActive={isWorkoutActive}
				elapsedWorkoutSeconds={elapsedWorkoutSeconds}
				isWorkoutPaused={isWorkoutPaused}
				onToggleWorkoutPause={onToggleWorkoutPause}
				exerciseSecondsRemaining={exerciseSecondsRemaining}
				restSecondsRemaining={restSecondsRemaining}
				isResting={isResting}
				restNextExerciseId={restNextExerciseId}
				onSkipRest={onSkipRest}
				onExtendRest={onExtendRest}
				onToggleRestSound={onToggleRestSound}
				onToggleRestVibration={onToggleRestVibration}
				activeExerciseId={activeExerciseId}
				activeSet={activeSet}
				completedExerciseIds={completedExerciseIds}
				onSelectExercise={onSelectExercise}
				ratingExerciseId={ratingExerciseId}
				onCompleteExercise={onCompleteExercise}
				onRateExercise={onRateExercise}
				lastWorkoutDate={lastWorkoutDate}
				completedToday={completedToday}
				onStartNextWorkoutToday={onStartNextWorkoutToday}
				warmupStage={warmupStage}
				warmupAreas={warmupAreas}
				completedWarmupSteps={completedWarmupSteps}
				onToggleWarmupStep={onToggleWarmupStep}
				onChooseWarmup={onChooseWarmup}
				onToggleWarmupArea={onToggleWarmupArea}
				onShowWarmupSteps={onShowWarmupSteps}
				onBeginExercises={onBeginExercises}
			/>
		</div>
	);
}
