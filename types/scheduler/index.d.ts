type TSchedulerPriority = number;
type TSchedulerCallback = (...args: any) => TSchedulerCallback | void;

declare module 'scheduler' {
	export function unstable_scheduleCallback(
		schedulerPriority: TSchedulerPriority,
		callback: TSchedulerCallback
	): TSchedulerCallback;

	export const NormalPriority: TSchedulerPriority;
}
