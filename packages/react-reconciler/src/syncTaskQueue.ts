let syncQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback: (...args: any) => void) {
	if (!syncQueue) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			syncQueue.forEach((callback) => callback());
			syncQueue = null;
		} catch (e) {
			console.error('TODO flushSyncCallbacks报错');
		} finally {
			isFlushingSyncQueue = false;
		}
	}
}
