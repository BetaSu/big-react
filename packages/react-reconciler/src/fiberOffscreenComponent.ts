import { OffscreenMode, Wakeable } from 'shared/ReactTypes';
import { FiberNode } from './fiber';

export interface OffscreenProps {
	mode?: OffscreenMode;
	children?: FiberNode;
}
export type OffscreenInstance = {
	visibility: OffscreenVisibility;
	retryCache: WeakSet<Wakeable> | Set<Wakeable> | null;
};

export type OffscreenVisibility = number;

export const OffscreenVisible = 0b01;
