import React, { useEffect, useState } from "react";
import {
	Bell,
	ChevronDown,
	CloudDownload,
	Database,
	Dumbbell,
	FlaskConical,
	Save,
	Monitor,
	Moon,
	Sun,
	Trash2,
} from "lucide-react";
import { ReminderSettings } from "../lib/storage";
import { NotificationStatus } from "../lib/notifications";
import Modal from "../components/Modal";
import type { SavedPlan } from "../App";

type TemplateId = "ppl" | "home" | "beginner";
type Section = "workout" | "notifications" | "data" | "danger";
type SettingsProps = {
	onOpenTemplates: () => void;
	onOpenSavedPlans: () => void;
	onExportPlan: () => void;
	onImportPlan: () => void;
	onExportBackup: () => void;
	onImport: () => void;
	onResetHistory: () => void;
	onReset: () => void;
	isTemplateModalOpen: boolean;
	onCloseTemplateModal: () => void;
	onUseTemplate: (templateId: TemplateId) => void;
	isSavedPlansModalOpen: boolean;
	onCloseSavedPlansModal: () => void;
	savedPlans: (SavedPlan | null)[];
	onSavePlanSlot: (index: number, name: string) => void;
	onUseSavedPlan: (index: number) => void;
	onDeleteSavedPlan: (index: number) => void;
	themePref: "system" | "light" | "dark";
	onCycleTheme: () => void;
	weightTrackingEnabled: boolean;
	onToggleWeightTracking: () => void;
	weeklyWorkoutGoal: number;
	onWeeklyWorkoutGoalChange: (goal: number) => void;
	restSeconds: number;
	onRestSecondsChange: (seconds: number) => void;
	reminders: ReminderSettings;
	onRemindersChange: (settings: ReminderSettings) => void;
	notificationPermission: NotificationStatus;
	onEnableNotifications: () => void | Promise<void>;
	isInstalled: boolean;
	canInstall: boolean;
	onInstall: () => void | Promise<void>;
};
const selectClass =
	"min-h-10 rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none dark:border-white/20 dark:bg-black dark:text-white";

export default function Settings(p: SettingsProps) {
	const {
		onOpenTemplates,
		onOpenSavedPlans,
		onExportPlan,
		onImportPlan,
		onExportBackup,
		onImport,
		onResetHistory,
		onReset,
		isTemplateModalOpen,
		onCloseTemplateModal,
		onUseTemplate,
		isSavedPlansModalOpen,
		onCloseSavedPlansModal,
		savedPlans,
		onSavePlanSlot,
		onUseSavedPlan,
		onDeleteSavedPlan,
		themePref,
		onCycleTheme,
		weightTrackingEnabled,
		onToggleWeightTracking,
		weeklyWorkoutGoal,
		onWeeklyWorkoutGoalChange,
		restSeconds,
		onRestSecondsChange,
		reminders,
		onRemindersChange,
		notificationPermission,
		onEnableNotifications,
		isInstalled,
		canInstall,
		onInstall,
	} = p;
	const [open, setOpen] = useState<Section | null>("workout");
	const [planNames, setPlanNames] = useState<string[]>(() =>
		Array.from({ length: 5 }, (_, index) => savedPlans[index]?.name || `Plan ${index + 1}`),
	);
	const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
	useEffect(() => {
		if (isSavedPlansModalOpen)
			setPlanNames(Array.from({ length: 5 }, (_, index) => savedPlans[index]?.name || `Plan ${index + 1}`));
	}, [isSavedPlansModalOpen, savedPlans]);
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const update = (next: Partial<ReminderSettings>) =>
		onRemindersChange({ ...reminders, ...next, enabled: true });
	const themeLabel =
		themePref === "system" ? "System" : themePref === "dark" ? "Dark" : "Light";
	const ThemeIcon =
		themePref === "system" ? Monitor : themePref === "dark" ? Moon : Sun;
	const notificationSummary =
		notificationPermission !== "granted"
			? "Off"
			: [
					reminders.workout.enabled ? "Workouts" : "",
					reminders.weighIn.enabled ? "Weigh-ins" : "",
				]
					.filter(Boolean)
					.join(", ") || "No reminders";
	const savedPlanSlots = savedPlans.flatMap((plan, index) =>
		plan ? [index] : [],
	);
	const firstEmptyPlanSlot = savedPlans.findIndex((plan) => !plan);
	const visiblePlanSlots =
		firstEmptyPlanSlot >= 0
			? [...savedPlanSlots, firstEmptyPlanSlot]
			: savedPlanSlots;
	return (
		<>
			<div className="space-y-3 pb-3">
				<section className="grid grid-cols-2 gap-2">
					<button
						onClick={onCycleTheme}
						className="flex min-h-24 flex-col justify-between rounded-2xl border border-black/10 bg-black/[.025] p-4 text-left dark:border-white/15 dark:bg-white/[.05]"
					>
						<ThemeIcon size={20} />
						<span>
							<b className="block text-sm">Appearance</b>
							<span className="text-xs text-black/50 dark:text-white/50">
								{themeLabel} theme
							</span>
						</span>
					</button>
					<button
						disabled={isInstalled || !canInstall}
						onClick={onInstall}
						className="flex min-h-24 flex-col justify-between rounded-2xl border border-black/10 bg-black/[.025] p-4 text-left disabled:opacity-55 dark:border-white/15 dark:bg-white/[.05]"
					>
						<CloudDownload size={20} />
						<span>
							<b className="block text-sm">
								{isInstalled
									? "App installed"
									: canInstall
										? "Install app"
										: "App & offline"}
							</b>
							<span className="text-xs text-black/50 dark:text-white/50">
								{isInstalled
									? "Ready offline"
									: canInstall
										? "Add to device"
										: "Use browser menu"}
							</span>
						</span>
					</button>
				</section>
				<div className="space-y-2">
					<SettingsSection
						id="workout"
						open={open === "workout"}
						onToggle={() => setOpen(open === "workout" ? null : "workout")}
						icon={<Dumbbell size={18} />}
						title="Workout"
						summary={`${weeklyWorkoutGoal}× weekly · ${restSeconds ? `${restSeconds}s rest` : "No rest timer"}`}
					>
						<SettingRow
							title="Weekly goal"
							detail="Workouts needed for a streak"
						>
							<select
								aria-label="Weekly workout goal"
								value={weeklyWorkoutGoal}
								onChange={(e) =>
									onWeeklyWorkoutGoalChange(Number(e.target.value))
								}
								className={selectClass}
							>
								{[1, 2, 3, 4, 5, 6, 7].map((goal) => (
									<option key={goal} value={goal}>
										{goal}×
									</option>
								))}
							</select>
						</SettingRow>
						<SettingRow title="Rest timer" detail="Default time after each set">
							<select
								aria-label="Rest timer duration"
								value={restSeconds}
								onChange={(e) => onRestSecondsChange(Number(e.target.value))}
								className={selectClass}
							>
								{[0, 30, 45, 60, 75, 90, 120, 180, 300].map((seconds) => (
									<option key={seconds} value={seconds}>
										{seconds === 0
											? "Off"
											: seconds < 60
												? `${seconds}s`
												: `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${seconds % 60}s` : ""}`}
									</option>
								))}
							</select>
						</SettingRow>
						<SettingRow
							title="Weight tracking"
							detail="History, trends, and weigh-ins"
						>
							<Switch
								checked={weightTrackingEnabled}
								onChange={onToggleWeightTracking}
								label="Weight tracking"
							/>
						</SettingRow>
						<button
							className="mt-3 min-h-11 w-full rounded-xl bg-black text-sm font-semibold text-white dark:bg-white dark:text-black"
							onClick={onOpenTemplates}
						>
							Browse workout templates
						</button>
						<button
							className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/20"
							onClick={onOpenSavedPlans}
						>
							<FlaskConical size={16} />
							My workout plans
						</button>
					</SettingsSection>
					<SettingsSection
						id="notifications"
						open={open === "notifications"}
						onToggle={() =>
							setOpen(open === "notifications" ? null : "notifications")
						}
						icon={<Bell size={18} />}
						title="Notifications"
						summary={notificationSummary}
					>
						{notificationPermission !== "granted" ? (
							<div className="rounded-xl bg-black/[.035] p-3 dark:bg-white/[.06]">
								<p className="text-xs leading-relaxed text-black/55 dark:text-white/55">
									Get workout, weigh-in, and rest timer reminders.
								</p>
								<button
									disabled={
										notificationPermission === "denied" ||
										notificationPermission === "unsupported"
									}
									className="mt-3 min-h-11 w-full rounded-xl bg-black text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
									onClick={onEnableNotifications}
								>
									{notificationPermission === "denied"
										? "Blocked in browser settings"
										: notificationPermission === "unsupported"
											? "Not supported on this device"
											: "Enable notifications"}
								</button>
							</div>
						) : (
							<>
								<div className="divide-y divide-black/10 dark:divide-white/10">
									<div className="py-3 first:pt-0">
										<div className="flex items-center justify-between gap-3">
											<div>
												<b className="block text-sm">Workout reminders</b>
												<span className="mt-0.5 block text-xs text-black/45 dark:text-white/45">
													On selected training days
												</span>
											</div>
											<Switch
												checked={reminders.workout.enabled}
												onChange={() =>
													update({
														workout: {
															...reminders.workout,
															enabled: !reminders.workout.enabled,
														},
													})
												}
												label="Workout reminders"
											/>
										</div>
										{reminders.workout.enabled && (
											<div className="mt-3 space-y-3">
												<DayPicker
													days={days}
													selected={reminders.workout.weekdays}
													onChange={(weekdays) =>
														update({
															workout: { ...reminders.workout, weekdays },
														})
													}
												/>
												<FieldLabel text="Time">
													<input
														aria-label="Workout reminder time"
														type="time"
														value={reminders.workout.time}
														onChange={(e) =>
															update({
																workout: {
																	...reminders.workout,
																	time: e.target.value,
																},
															})
														}
														className={`${selectClass} mt-1 w-full`}
													/>
												</FieldLabel>
											</div>
										)}
									</div>
									<div className="py-3 last:pb-0">
										<div className="flex items-center justify-between gap-3">
											<div>
												<b className="block text-sm">Weekly weigh-in</b>
												<span className="mt-0.5 block text-xs text-black/45 dark:text-white/45">
													One reminder each week
												</span>
											</div>
											<Switch
												checked={reminders.weighIn.enabled}
												onChange={() =>
													update({
														weighIn: {
															...reminders.weighIn,
															enabled: !reminders.weighIn.enabled,
														},
													})
												}
												label="Weekly weigh-in"
											/>
										</div>
										{reminders.weighIn.enabled && (
											<div className="mt-3 grid grid-cols-2 gap-2">
												<FieldLabel text="Day">
													<select
														aria-label="Weigh-in reminder day"
														value={reminders.weighIn.weekday}
														onChange={(e) =>
															update({
																weighIn: {
																	...reminders.weighIn,
																	weekday: Number(e.target.value),
																},
															})
														}
														className={`${selectClass} mt-1 w-full`}
													>
														{days.map((day, index) => (
															<option key={day} value={index}>
																{day}
															</option>
														))}
													</select>
												</FieldLabel>
												<FieldLabel text="Time">
													<input
														aria-label="Weigh-in reminder time"
														type="time"
														value={reminders.weighIn.time}
														onChange={(e) =>
															update({
																weighIn: {
																	...reminders.weighIn,
																	time: e.target.value,
																},
															})
														}
														className={`${selectClass} mt-1 w-full`}
													/>
												</FieldLabel>
											</div>
										)}
									</div>
								</div>
							</>
						)}
					</SettingsSection>
					<SettingsSection
						id="data"
						open={open === "data"}
						onToggle={() => setOpen(open === "data" ? null : "data")}
						icon={<Database size={18} />}
						title="Data & backup"
						summary="Share plans or restore data"
					>
						<div className="space-y-3">
							<div>
								<p className="mb-2 text-xs text-black/50 dark:text-white/50">
									Workout plan only
								</p>
								<div className="grid grid-cols-2 gap-2">
									<button
										className="min-h-11 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/20"
										onClick={onExportPlan}
									>
										Export plan
									</button>
									<button
										className="min-h-11 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/20"
										onClick={onImportPlan}
									>
										Import plan
									</button>
								</div>
							</div>
							<div>
								<p className="mb-2 text-xs text-black/50 dark:text-white/50">
									All app data
								</p>
								<div className="grid grid-cols-2 gap-2">
									<button
										className="min-h-11 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/20"
										onClick={onExportBackup}
									>
										Download backup
									</button>
									<button
										className="min-h-11 rounded-xl border border-black/15 text-sm font-semibold dark:border-white/20"
										onClick={onImport}
									>
										Import backup
									</button>
								</div>
							</div>
						</div>
					</SettingsSection>
					<SettingsSection
						id="danger"
						open={open === "danger"}
						onToggle={() => setOpen(open === "danger" ? null : "danger")}
						icon={<Trash2 size={18} />}
						title="Reset"
						summary="History or all data"
						danger
					>
						<div className="grid grid-cols-2 gap-2">
							<button
								className="min-h-11 rounded-xl border border-red-300 text-sm font-semibold text-red-700 dark:border-red-500/40 dark:text-red-300"
								onClick={onResetHistory}
							>
								Reset history
							</button>
							<button
								className="min-h-11 rounded-xl bg-red-700 text-sm font-semibold text-white dark:bg-red-600"
								onClick={onReset}
							>
								Reset all data
							</button>
						</div>
					</SettingsSection>
				</div>
			</div>
			<Modal
				open={isTemplateModalOpen}
				title="Workout templates"
				onClose={onCloseTemplateModal}
			>
				<div className="space-y-2">
					{(
						[
							[
								"ppl",
								"Classic Push–Pull–Legs",
								"5 training days · barbell + cable · 7-day cycle",
							],
							[
								"home",
								"At-Home Bodyweight Split",
								"5 training days · 100% bodyweight · no equipment",
							],
							[
								"beginner",
								"Beginner Strength & Walking",
								"Gentle 7-day cycle · walking + strength · Week 1",
							],
						] as [TemplateId, string, string][]
					).map(([id, name, detail]) => (
						<button
							key={id}
							className="flex w-full items-center gap-3 rounded-xl border border-black/10 p-3 text-left hover:border-black/30 dark:border-white/15 dark:hover:border-white/35"
							onClick={() => onUseTemplate(id)}
						>
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
								<Dumbbell size={17} />
							</span>
							<span className="min-w-0">
								<b className="block text-sm">{name}</b>
								<span className="block text-xs text-black/50 dark:text-white/50">
									{detail}
								</span>
							</span>
						</button>
					))}
				</div>
			</Modal>
			<Modal
				open={isSavedPlansModalOpen}
				title="My workout plans"
				onClose={() => { setConfirmDelete(null); onCloseSavedPlansModal(); }}
			>
				<div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
					{visiblePlanSlots.map((index) => {
						const saved = savedPlans[index];
						return (
							<div key={index} className={`rounded-xl border transition-colors ${saved ? "border-black/10 p-3 dark:border-white/15" : "border-dashed border-black/20 dark:border-white/25"}`}>
								{!saved ? (
									<button onClick={() => onSavePlanSlot(index, `Plan ${index + 1}`)} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-black/45 hover:bg-black/[.025] hover:text-black dark:text-white/45 dark:hover:bg-white/[.04] dark:hover:text-white">
										<Save size={15} /> Click to save
									</button>
								) : (
								<>
								<div className="flex items-center gap-2">
									<input
										aria-label={`Plan ${index + 1} name`}
										maxLength={40}
										value={planNames[index] || ""}
										onChange={(event) => setPlanNames((names) => names.map((name, i) => i === index ? event.target.value : name))}
										className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent px-1 py-2 text-sm font-semibold outline-none hover:border-black/10 focus:border-black/35 dark:hover:border-white/10 dark:focus:border-white/35"
									/>
									<span className="shrink-0 text-[10px] text-black/35 dark:text-white/35">
										Updated {new Date(saved.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
									</span>
								</div>
								<div className="mt-2 flex gap-1.5">
									<button onClick={() => onUseSavedPlan(index)} className="min-h-8 flex-1 rounded-lg bg-black text-xs font-semibold text-white dark:bg-white dark:text-black">Load</button>
									<button onClick={() => onSavePlanSlot(index, planNames[index])} className="min-h-8 rounded-lg px-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">Update</button>
									{saved && (confirmDelete === index ? <div className="flex gap-1"><button onClick={() => setConfirmDelete(null)} className="min-h-9 px-2 text-xs text-black/45 dark:text-white/45">Cancel</button><button onClick={() => { onDeleteSavedPlan(index); setConfirmDelete(null); }} className="min-h-9 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white">Delete</button></div> : <button aria-label={`Delete ${saved.name}`} onClick={() => setConfirmDelete(index)} className="min-h-9 rounded-lg px-2.5 text-black/35 hover:bg-red-50 hover:text-red-700 dark:text-white/35 dark:hover:bg-red-950/30 dark:hover:text-red-300"><Trash2 size={14} /></button>)}
								</div>
								</>
								)}
							</div>
						);
					})}
				</div>
			</Modal>
		</>
	);
}

function SettingsSection({
	id,
	open,
	onToggle,
	icon,
	title,
	summary,
	children,
	danger = false,
}: {
	id: Section;
	open: boolean;
	onToggle: () => void;
	icon: React.ReactNode;
	title: string;
	summary: string;
	children: React.ReactNode;
	danger?: boolean;
}) {
	return (
		<section
			className={`overflow-hidden rounded-2xl border bg-black/[.012] dark:bg-white/[.025] ${danger ? "border-red-300/70 dark:border-red-500/30" : "border-black/10 dark:border-white/15"}`}
		>
			<button
				type="button"
				aria-expanded={open}
				aria-controls={`${id}-settings`}
				onClick={onToggle}
				className={`flex w-full items-center gap-3 px-4 py-4 text-left ${danger ? "text-red-700 dark:text-red-300" : ""}`}
			>
				<span className="shrink-0 opacity-65">{icon}</span>
				<span className="min-w-0 flex-1">
					<b className="block text-sm leading-5">{title}</b>
					<span className="mt-1 block truncate text-xs font-normal leading-4 opacity-50">
						{summary}
					</span>
				</span>
				<ChevronDown
					size={17}
					className={`shrink-0 opacity-45 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>
			{open && (
				<div
					id={`${id}-settings`}
					className="border-t border-black/10 bg-black/[.015] p-3 dark:border-white/10 dark:bg-white/[.025]"
				>
					{children}
				</div>
			)}
		</section>
	);
}
function SettingRow({
	title,
	detail,
	children,
}: {
	title: string;
	detail: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-[62px] items-center justify-between gap-3 border-b border-black/10 py-2 last:border-0 dark:border-white/10">
			<span>
				<b className="block text-sm">{title}</b>
				<span className="block text-xs text-black/45 dark:text-white/45">
					{detail}
				</span>
			</span>
			<span className="shrink-0">{children}</span>
		</div>
	);
}
function Switch({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={onChange}
			className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-black dark:bg-white" : "bg-black/15 dark:bg-white/20"}`}
		>
			<span
				className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform dark:bg-black ${checked ? "translate-x-4" : ""}`}
			/>
		</button>
	);
}
function FieldLabel({
	text,
	children,
}: {
	text: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
			{text}
			{children}
		</label>
	);
}
function DayPicker({
	days,
	selected,
	onChange,
}: {
	days: string[];
	selected: number[];
	onChange: (days: number[]) => void;
}) {
	return (
		<fieldset>
			<legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">
				Days
			</legend>
			<div className="grid grid-cols-7 gap-1">
				{days.map((day, index) => (
					<button
						type="button"
						aria-pressed={selected.includes(index)}
						aria-label={day}
						key={day}
						onClick={() =>
							onChange(
								selected.includes(index)
									? selected.filter((value) => value !== index)
									: [...selected, index].sort(),
							)
						}
						className={`min-h-8 rounded-lg border text-[10px] font-semibold ${selected.includes(index) ? "border-black bg-black text-white dark:border-white/40 dark:bg-white/15 dark:text-white" : "border-black/10 text-black/45 dark:border-white/10 dark:text-white/45"}`}
					>
						{day.slice(0, 2)}
					</button>
				))}
			</div>
		</fieldset>
	);
}
