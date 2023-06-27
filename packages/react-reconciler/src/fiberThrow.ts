import { Wakeable } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { DidCapture } from './fiberFlags';

export type RetryQueue = Set<Wakeable<any>>;

export function throwException(unitOfWork: FiberNode, value: any) {
	if (
		value !== null &&
		typeof value === 'object' &&
		typeof value.then === 'function'
	) {
		const weakable: Wakeable<any> = value;
		// 为了简化 假设一定是Suspense包裹一层lazy,
		const suspenseBoundary = unitOfWork!.return!.return!;
		suspenseBoundary.flags |= DidCapture;
		const retryQueue = suspenseBoundary.updateQueue as RetryQueue | null;
		if (retryQueue === null) {
			suspenseBoundary.updateQueue = new Set([weakable]);
		} else {
			retryQueue.add(weakable);
		}
	}
}
