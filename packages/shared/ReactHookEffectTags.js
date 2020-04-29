

export const NoEffect = /*  */ 0b000;

// 代表是否需要触发effect
export const HasEffect = /* */ 0b001;

// Represents the phase in which the effect (not the clean-up) fires.
// 代表effect触发的阶段（非清除effect）
export const Layout = /*    */ 0b010;
export const Passive = /*   */ 0b100;
