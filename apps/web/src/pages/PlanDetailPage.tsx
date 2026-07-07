import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SessionPlanDocument, SessionPlanRow } from "@session-plan/shared";
import { DELIVERY_METHODS, buildSessionPlanFilename, buildSessionPlanZipFilename } from "@session-plan/shared";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SessionPlanRow[]>([]);
  const [message, setMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["session-plan", id],
    queryFn: () => api.get<SessionPlanDocument>(`/session-plans/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (data) setRows(data.rows);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch<SessionPlanDocument>(`/session-plans/${id}`, { rows, status: "draft" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-plan", id] });
      queryClient.invalidateQueries({ queryKey: ["session-plans"] });
      setMessage("Saved successfully.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/session-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-plans"] });
      navigate("/dashboard");
    },
  });

  function updateRow(index: number, patch: Partial<SessionPlanRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function getDownloadFilename(): string {
    if (!data) return "session-plan.docx";
    const facultyName = user?.name ?? "Faculty";
    if (data.metadata.divisions.length > 1) {
      return buildSessionPlanZipFilename(data.metadata, facultyName, data.dateRange);
    }
    return buildSessionPlanFilename(
      data.metadata,
      facultyName,
      data.dateRange,
      data.metadata.divisions[0],
    );
  }

  async function downloadDocx() {
    if (!id || !data) return;
    setMessage("");
    try {
      const result = await api.download(`/session-plans/${id}/docx`, getDownloadFilename());
      setMessage(`Downloaded ${result.filename}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Download failed");
    }
  }

  function handleDelete() {
    if (!window.confirm("Delete this session plan permanently?")) return;
    deleteMutation.mutate();
  }

  if (isLoading) return <div className="container">Loading plan...</div>;
  if (error || !data) return <div className="container error">{(error as Error)?.message ?? "Plan not found"}</div>;

  const isZip = data.metadata.divisions.length > 1;

  return (
    <div className="container">
      <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1>{data.metadata.subjectName}</h1>
          <p className="muted">
            {data.metadata.class} | Sem {data.metadata.semester} | Divisions{" "}
            {data.metadata.divisions?.join(", ")} | AY {data.metadata.academicYear}
          </p>
        </div>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Session No</th>
              <th>Unit No & Name</th>
              <th>Topic</th>
              <th>Reference</th>
              <th>Delivery Method</th>
              <th>Completed On</th>
              <th>Room No</th>
              <th>Time</th>
              <th>Students Present</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.sessionNo}>
                <td>{row.sessionNo}</td>
                <td>
                  <input className="input" value={row.unitNoAndName} onChange={(e) => updateRow(index, { unitNoAndName: e.target.value })} />
                </td>
                <td>
                  <textarea className="textarea" style={{ minHeight: 80 }} value={row.topic} onChange={(e) => updateRow(index, { topic: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={row.reference ?? ""} onChange={(e) => updateRow(index, { reference: e.target.value })} />
                </td>
                <td>
                  <select
                    className="select"
                    value={row.deliveryMethod}
                    onChange={(e) => updateRow(index, { deliveryMethod: e.target.value as SessionPlanRow["deliveryMethod"] })}
                  >
                    {DELIVERY_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input className="input" value={row.completedOn} onChange={(e) => updateRow(index, { completedOn: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={row.roomNo ?? ""} onChange={(e) => updateRow(index, { roomNo: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={row.time} onChange={(e) => updateRow(index, { time: e.target.value })} />
                </td>
                <td>
                  <input
                    className="input"
                    value={row.studentsPresent ?? ""}
                    onChange={(e) => updateRow(index, { studentsPresent: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row-actions" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save changes"}
        </button>
        <button className="btn btn-primary" onClick={downloadDocx}>
          Download {isZip ? "ZIP" : "DOCX"}
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? "Deleting..." : "Delete plan"}
        </button>
      </div>
      {message && <p className="muted">{message}</p>}
    </div>
  );
}
