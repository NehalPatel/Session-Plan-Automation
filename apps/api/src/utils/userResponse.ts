import type { UserRole } from "@session-plan/shared";

export function toUserPublic(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role?: string | null;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: (user.role === "admin" ? "admin" : "user") as UserRole,
  };
}
