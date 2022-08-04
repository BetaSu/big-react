export type Flags = number;

export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
export const ChildDeletion = 0b00000000000000000000010000;

// useEffect
export const PassiveEffect = 0b00000000000000000000100000;

export const MutationMask = Placement | Update | ChildDeletion;

// 删除子节点可能触发useEffect destroy
export const PassiveMask = PassiveEffect | ChildDeletion;
