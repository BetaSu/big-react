import { REACT_LAZY_TYPE } from 'shared/ReactSymbols';
import { Thenable, Wakeable } from 'shared/ReactTypes';

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type UninitializedPayload<T> = {
	_status: -1;
	_result: () => Thenable<{ default: T }>;
};

type PendingPayload<T> = {
	_status: 0;
	_result: Wakeable<T>;
};

type ResolvedPayload<T> = {
	_status: 1;
	_result: { default: T };
};

type RejectedPayload<Err> = {
	_status: 2;
	_result: Err;
};

type Payload<T, Err = any> =
	| UninitializedPayload<T>
	| PendingPayload<T>
	| ResolvedPayload<T>
	| RejectedPayload<Err>;

export type LazyComponent<T, P> = {
	$$typeof: symbol | number;
	_payload: P;
	_init: (payload: P) => T;
};

function lazyInitializer<T>(payload: Payload<T>): T {
	if (payload._status === Uninitialized) {
		const ctor = payload._result;
		const thenable = ctor();
		const status = payload._status as number;
		thenable.then(
			(moduleObject) => {
				if (status === Pending || status === Uninitialized) {
					const resolved = payload as unknown as ResolvedPayload<T>;
					resolved._status = Resolved;
					resolved._result = moduleObject;
				}
			},
			(error) => {
				if (status === Pending || status === Uninitialized) {
					const rejected = payload as unknown as RejectedPayload<T>;
					rejected._status = Rejected;
					rejected._result = error;
				}
			}
		);
		if (payload._status === Uninitialized) {
			const pending = payload as unknown as PendingPayload<T>;
			pending._status = Pending;
			pending._result = thenable;
		}
	}

	if (payload._status === Resolved) {
		const moduleObject = payload._result;
		return moduleObject.default;
	} else {
		throw payload._result;
	}
}

export function lazy<T>(
	ctor: () => Thenable<{ default: T }>
): LazyComponent<T, Payload<T>> {
	const payload: Payload<T> = {
		_status: Uninitialized,
		_result: ctor
	};

	const lazyType: LazyComponent<T, Payload<T>> = {
		$$typeof: REACT_LAZY_TYPE,
		_payload: payload,
		_init: lazyInitializer
	};

	return lazyType;
}
