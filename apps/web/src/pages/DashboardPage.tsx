import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { SessionPlanDocument } from "@session-plan/shared";
import { api } from "../lib/api";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["session-plans"],
    queryFn: () => api.get<SessionPlanDocument[]>("/session-plans"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/session-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session-plans"] }),
  });

  function handleDelete(id: string, subjectName: string) {
    if (!window.confirm(`Delete session plan for "${subjectName}"?`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="container">
      <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1>My Session Plans</h1>
          <p className="muted">Create and manage your automated session plans.</p>
        </div>
        <Link className="btn btn-primary" to="/plans/new">
          New Session Plan
        </Link>
      </div>

      <div className="card">
        {isLoading && <p>Loading plans...</p>}
        {error && <p className="error">{(error as Error).message}</p>}
        {!isLoading && !error && (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.metadata.subjectName}</td>
                    <td>{plan.metadata.class}</td>
                    <td>{plan.metadata.semester}</td>
                    <td>{plan.metadata.divisions?.join(", ") ?? "-"}</td>
                    <td>{plan.rows.length}</td>
                    <td>{plan.status}</td>
                    <td>{new Date(plan.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/plans/${plan.id}`}>Open</Link>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleDelete(plan.id, plan.metadata.subjectName)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8}>No session plans yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
