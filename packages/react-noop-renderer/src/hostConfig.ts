export interface Container {
	rootID: number;
	pendingChildren: (Instance | TextInstance)[];
	children: (Instance | TextInstance)[];
}
export interface Instance {
	id: number;
	type: string;
	children: (Instance | TextInstance)[];
	parent: number;
	props: any;
}
export interface TextInstance {
	text: string;
	id: number;
	parent: number;
}

import { FiberNode } from 'react-reconciler/src/fiber';
import { DefaultLane } from 'react-reconciler/src/fiberLanes';
import { HostText } from 'react-reconciler/src/workTags';

let instanceCounter = 0;

export const createInstance = (type: string, props: any): Instance => {
	const instance = {
		id: instanceCounter++,
		type: type,
		children: [],
		parent: -1,
		props
	};
	return instance;
};

export const createTextInstance = (content: string): TextInstance => {
	const instance = {
		text: content,
		id: instanceCounter++,
		parent: -1
	};
	return instance;
};

export const appendInitialChild = (parent: Instance, child: Instance) => {
	const prevParent = child.parent;
	if (prevParent !== -1 && prevParent !== parent.id) {
		throw new Error('不能重复挂载child');
	}
	child.parent = parent.id;
	parent.children.push(child);
};

export const appendChildToContainer = (
	child: Instance | TextInstance,
	container: Container
) => {
	const prevParent = child.parent;
	if (prevParent !== -1 && prevParent !== container.rootID) {
		throw new Error('不能重复挂载child');
	}
	child.parent = container.rootID;
	const index = container.children.indexOf(child);
	if (index !== -1) {
		container.children.splice(index, 1);
	}
	container.children.push(child);
};

export const insertChildToContainer = (
	child: Instance,
	container: Container,
	before: Instance
) => {
	const index = container.children.indexOf(child);
	if (index !== -1) {
		container.children.splice(index, 1);
	}
	const beforeIndex = container.children.indexOf(before);
	if (beforeIndex === -1) {
		throw new Error('before不存在');
	}
	container.children.splice(beforeIndex, 0, child);
};

export const removeChild = (child: Instance, container: Container) => {
	const index = container.children.indexOf(child);
	if (index === -1) {
		throw new Error('child不存在');
	}
	container.children.splice(index, 1);
};

export function commitUpdate(finishedWork: FiberNode) {
	switch (finishedWork.tag) {
		case HostText:
			const newContent = finishedWork.pendingProps.content;
			return commitTextUpdate(finishedWork.stateNode, newContent);
	}
	console.error('commitUpdate未支持的类型', finishedWork);
}

export const commitTextUpdate = (
	textIntance: TextInstance,
	content: string
) => {
	textIntance.text = content;
};

export const scheduleMicrotask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: () => void) => Promise.resolve(null).then(callback)
		: setTimeout;
