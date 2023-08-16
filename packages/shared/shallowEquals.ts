export function shallowEqual(a: any, b: any): boolean {
	if (Object.is(a, b)) {
		return true;
	}

	if (
		typeof a !== 'object' ||
		a === null ||
		typeof b !== 'object' ||
		b === null
	) {
		return false;
	}

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	if (keysA.length !== keysB.length) {
		return false;
	}

	for (let i = 0; i < keysA.length; i++) {
		const key = keysA[i];
		// b没有key、 key不想等
		if (!{}.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
			return false;
		}
	}
	return true;
}
