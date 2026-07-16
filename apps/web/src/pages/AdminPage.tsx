import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import type { AdminUserSummary } from "@session-plan/shared";
import { api } from "../lib/api";

export function AdminPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<{ users: AdminUserSummary[] }>("/admin/users"),
  });

  const users = data?.users ?? [];
  const totalPlans = users.reduce((sum, user) => sum + user.planCount, 0);

  function toggle(userId: string) {
    setExpanded((current) => ({ ...current, [userId]: !current[userId] }));
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <h1>Users</h1>
        <p className="muted">All registered faculty users and their session plans.</p>
      </div>

      <div className="card">
        {isLoading && <p>Loading users...</p>}
        {error && <p className="error">{(error as Error).message}</p>}
        {!isLoading && !error && (
          <div className="stack">
            <p className="muted">
              {users.length} user{users.length === 1 ? "" : "s"} · {totalPlans} session plan
              {totalPlans === 1 ? "" : "s"}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plans</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <Fragment key={user.id}>
                      <tr>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.planCount}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => toggle(user.id)}
                            disabled={user.planCount === 0}
                          >
                            {expanded[user.id] ? "Hide plans" : "View plans"}
                          </button>
                        </td>
                      </tr>
                      {expanded[user.id] && (
                        <tr>
                          <td colSpan={5}>
                            {user.plans.length === 0 ? (
                              <p className="muted">No session plans for this user.</p>
                            ) : (
                              <div className="table-wrap">
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Subject</th>
                                      <th>Class</th>
                                      <th>Semester</th>
                                      <th>Divisions</th>
                                      <th>Sessions</th>
                                      <th>Status</th>
                                      <th>Updated</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {user.plans.map((plan) => (
                                      <tr key={plan.id}>
                                        <td>{plan.subjectName}</td>
                                        <td>{plan.class}</td>
                                        <td>{plan.semester}</td>
                                        <td>{plan.divisions.join(", ") || "-"}</td>
                                        <td>{plan.sessionCount}</td>
                                        <td>{plan.status}</td>
                                        <td>{new Date(plan.updatedAt).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
