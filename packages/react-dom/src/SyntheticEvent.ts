import { Container } from './hostConfig';

// 支持的事件类型
const validEventTypeList = ['click'];
const elementEventPropsKey = '__props';

type EventCallback = (e: SyntheticEvent) => void;
interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}
interface SyntheticEvent extends Event {
	type: string;
	__stopPropagation: boolean;
}

export interface PackagedElement extends Element {
	[elementEventPropsKey]: {
		[eventType: string]: EventCallback;
	};
}

function createSyntheticEvent(e: Event): SyntheticEvent {
	const syntheticEvent = e as SyntheticEvent;
	syntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;

	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};

	return syntheticEvent;
}

function getEventCallbackNameFromtEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

// 将支持的事件回调保存在DOM中
export const updateFiberProps = (
	node: Element,
	props: any
): PackagedElement => {
	(node as PackagedElement)[elementEventPropsKey] =
		(node as PackagedElement)[elementEventPropsKey] || {};

	validEventTypeList.forEach((eventType) => {
		const callbackNameList = getEventCallbackNameFromtEventType(eventType);

		if (!callbackNameList) {
			return;
		}
		callbackNameList.forEach((callbackName) => {
			if (Object.hasOwnProperty.call(props, callbackName)) {
				(node as PackagedElement)[elementEventPropsKey][callbackName] =
					props[callbackName];
			}
		});
	});
	return node as PackagedElement;
};

const triggerEventFlow = (paths: EventCallback[], se: SyntheticEvent) => {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
};

const dispatchEvent = (container: Container, eventType: string, e: Event) => {
	const targetElement = e.target;

	if (targetElement === null) {
		console.error('事件不存在target', e);
		return;
	}

	const { capture, bubble } = collectPaths(
		targetElement as PackagedElement,
		container,
		eventType
	);
	const se = createSyntheticEvent(e);
	if (__LOG__) {
		console.log('模拟事件捕获阶段：', eventType);
	}
	triggerEventFlow(capture, se);
	if (!se.__stopPropagation) {
		if (__LOG__) {
			console.log('模拟事件冒泡阶段：', eventType);
		}
		triggerEventFlow(bubble, se);
	}
};

// 收集从目标元素到HostRoot之间所有目标回调函数
const collectPaths = (
	targetElement: PackagedElement,
	container: Container,
	eventType: string
): Paths => {
	const paths: Paths = {
		capture: [],
		bubble: []
	};
	// 收集事件回调是冒泡的顺序
	while (targetElement && targetElement !== container) {
		const eventProps = targetElement[elementEventPropsKey];
		if (eventProps) {
			const callbackNameList = getEventCallbackNameFromtEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = eventProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							// 反向插入捕获阶段的事件回调
							paths.capture.unshift(eventCallback);
						} else {
							// 正向插入冒泡阶段的事件回调
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as PackagedElement;
	}
	return paths;
};

export const initEvent = (container: Container, eventType: string) => {
	if (!validEventTypeList.includes(eventType)) {
		console.error('当前不支持', eventType, '事件');
		return;
	}
	if (__LOG__) {
		console.log('初始化事件：', eventType);
	}
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
};
