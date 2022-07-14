import { PackagedElement, updateEventProps } from './SyntheticEvent';

export type Container = PackagedElement | Document;
export type Instance = PackagedElement;
export type TextInstance = Text;

export const createInstance = (type: string, props: any) => {
	const element = document.createElement(type);
	return updateEventProps(element, props);
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

export const removeChild = (child: Instance, container: Container) => {
	container.removeChild(child);
};

export const commitTextUpdate = (
	textIntance: TextInstance,
	content: string
) => {
	textIntance.nodeValue = content;
};
