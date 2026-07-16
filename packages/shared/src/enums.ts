export const BCA_CLASSES = ["FYBCA", "SYBCA", "TYBCA"] as const;
export type BcaClass = (typeof BCA_CLASSES)[number];

export const DIVISIONS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export type Division = (typeof DIVISIONS)[number];

export const DELIVERY_METHODS = ["Theory", "Demo", "PPT"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const UNIT_SELECTION_MODES = ["all", "firstN", "manual"] as const;
export type UnitSelectionMode = (typeof UNIT_SELECTION_MODES)[number];

export const PLAN_STATUSES = ["draft", "final"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
