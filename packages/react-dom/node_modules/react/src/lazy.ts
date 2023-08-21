import { Thenable, Wakeable } from 'shared/ReactTypes';
import { REACT_LAZY_TYPE } from 'shared/ReactSymbols';

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type UninitializedPayload<T> = {
	_status: typeof Uninitialized;
	_result: () => Thenable<{ default: T }>;
};

type PendingPayload = {
	_status: typeof Pending;
	_result: Wakeable;
};

type ResolvedPayload<T> = {
	_status: typeof Resolved;
	_result: { default: T };
};

type RejectedPayload = {
	_status: typeof Rejected;
	_result: any;
};

type Payload<T> =
	| UninitializedPayload<T>
	| PendingPayload
	| ResolvedPayload<T>
	| RejectedPayload;

export type LazyComponent<T, P> = {
	$$typeof: symbol | number;
	_payload: P;
	_init: (payload: P) => T;
};

function lazyInitializer<T>(payload: Payload<T>): T {
	if (payload._status === Uninitialized) {
		const ctor = payload._result;
		const thenable = ctor();
		thenable.then(
			(moduleObject) => {
				// @ts-ignore
				const resolved: ResolvedPayload<T> = payload;
				resolved._status = Resolved;
				resolved._result = moduleObject;
			},
			(error) => {
				// @ts-ignore
				const rejected: RejectedPayload = payload;
				rejected._status = Rejected;
				rejected._result = error;
			}
		);
		if (payload._status === Uninitialized) {
			// @ts-ignore
			const pending: PendingPayload = payload;
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
