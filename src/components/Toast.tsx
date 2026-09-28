import React, { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function Toast({
	message,
	onClose,
}: {
	message: string;
	onClose: () => void;
}) {
	useEffect(() => {
		const id = window.setTimeout(onClose, 3500);
		return () => window.clearTimeout(id);
	}, [message, onClose]);
	return (
		<div
			className="fixed inset-x-3 bottom-[max(16px,env(safe-area-inset-bottom))] z-[120] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-black"
			role="status"
			aria-live="polite"
		>
			<CheckCircle2 size={18} className="shrink-0" />
			<span className="min-w-0 flex-1">{message}</span>
			<button
				onClick={onClose}
				aria-label="Dismiss message"
				className="rounded p-1 opacity-60"
			>
				<X size={15} />
			</button>
		</div>
	);
}
