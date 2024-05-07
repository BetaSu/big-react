import { PackagedElement, updateFiberProps } from './SyntheticEvent';
import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';

export type Container = PackagedElement;
export type Instance = PackagedElement;
export type TextInstance = Text;

export const createInstance = (type: string, props: any): Instance => {
	const element = document.createElement(type);
	return updateFiberProps(element, props);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendInitialChild = (parent: Instance, child: Instance) => {
	parent.appendChild(child);
};

export const appendChildToContainer = (
	child: Instance,
	container: Container
) => {
	container.appendChild(child);
};

export const insertChildToContainer = (
	child: Instance,
	container: Container,
	before: Instance
) => {
	container.insertBefore(child, before);
};

export const removeChild = (child: Instance, container: Container) => {
	container.removeChild(child);
};

export function commitUpdate(finishedWork: FiberNode) {
	if (__LOG__) {
		console.log('更新DOM、文本节点内容', finishedWork);
	}
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
	textIntance.nodeValue = content;
};

export const scheduleMicrotask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: () => void) => Promise.resolve(null).then(callback)
		: setTimeout;
