"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  companyName: string;
  positionTitle: string;
  location: string;
  companyPhone?: string | null;
  payMin?: number | null;
  payMax?: number | null;
  payPeriod?: string | null;
  shift?: string | null;
  hoursPerWeek?: number | null;
  status: string;
  source: string;
  jobUrl: string;
  dateApplied: string | null;
  lastFollowedUpOn?: string | null;
  notes?: string | null;
  jobDescription?: string | null;
};

function fmtPay(r: Row) {
  if (!r.payMin && !r.payMax) return "";
  const min = r.payMin ?? "";
  const max = r.payMax ?? "";
  const period = r.payPeriod ? `/${r.payPeriod}` : "";
  if (min && max) return `${min}-${max}${period}`;
  return `${min || max}${period}`;
}

function pillStyle(status: string): React.CSSProperties {
  const s = status.toLowerCase();
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  };

  if (s.includes("applied")) return { ...base, background: "rgba(80, 200, 120, 0.18)" };
  if (s.includes("interview")) return { ...base, background: "rgba(120, 160, 255, 0.18)" };
  if (s.includes("offer")) return { ...base, background: "rgba(255, 200, 80, 0.18)" };
  if (s.includes("rejected")) return { ...base, background: "rgba(255, 90, 90, 0.18)" };
  if (s.includes("follow")) return { ...base, background: "rgba(255, 140, 80, 0.18)" };
  if (s.includes("interested")) return { ...base, background: "rgba(255,255,255,0.10)" };

  return base;
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(700px, 90vw)",
          maxHeight: "90vh",
          overflow: "auto",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(18,18,18,0.98)",
          boxShadow: "0 12px 50px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            backdropFilter: "blur(10px)",
            background: "rgba(18,18,18,0.92)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function renderJobDescription(raw: string) {
  const text = (raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return <div style={{ opacity: 0.7 }}>No description captured.</div>;

  // If we DO have real paragraphs, use them.
  const hasNewlines = /\n/.test(text);
  if (hasNewlines) {
    const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    return (
      <div style={{ lineHeight: 1.65 }}>
        {paras.map((p, i) => (
          <p key={i} style={{ margin: "0 0 12px 0", whiteSpace: "pre-wrap" }}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  // Otherwise: create paragraphs from section headers + sentence blocks.
  // Common job-post section headers (add more any time)
  const headers = [
    "Overview",
    "Job Summary",
    "Responsibilities",
    "Duties",
    "Requirements",
    "Qualifications",
    "Preferred Qualifications",
    "Basic Qualifications",
    "Benefits",
    "Compensation",
    "Schedule",
    "Shift",
    "Work Environment",
    "Equal Opportunity Employer",
  ];

  // Insert newlines before headers when they appear mid-text (case-insensitive)
  let normalized = text;
  for (const h of headers) {
    const re = new RegExp(`\\s(${h})(\\s*[:\\-])`, "gi");
    normalized = normalized.replace(re, `\n\n$1$2`);
  }

  // Now split into paragraphs. If still only 1, split into sentence chunks.
  let paras = normalized.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  if (paras.length === 1) {
    // Break into readable chunks of ~2–3 sentences
    const sentences = normalized
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map(s => s.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let buf: string[] = [];
    for (const s of sentences) {
      buf.push(s);
      if (buf.length >= 3) {
        chunks.push(buf.join(" "));
        buf = [];
      }
    }
    if (buf.length) chunks.push(buf.join(" "));

    paras = chunks;
  }

  return (
    <div style={{ lineHeight: 1.65 }}>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: "0 0 12px 0" }}>
          {p}
        </p>
      ))}
    </div>
  );
}



export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [notesDraft, setNotesDraft] = useState("");


  async function patchRow(id: string, patch: Partial<Row>) {
    const r = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(await r.text());
    const updated: Row = await r.json();

    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...updated } : x)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
  }

  async function deleteRow(id: string) {
    const r = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const text = await r.text();
      alert(text); // <-- show server's JSON error
      throw new Error(text);
    }

    setRows((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => (prev?.id === id ? null : prev));
  }


  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then(setRows)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !needle ||
        [r.companyName, r.positionTitle, r.location, r.source, r.shift ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      const matchesStatus = !status || r.status === status;
      return matchesQ && matchesStatus;
    });
  }, [rows, q, status]);

  const statuses = useMemo(() => {
    const s = new Set(rows.map((r) => r.status));
    return ["", ...Array.from(s)];
  }, [rows]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 18,
        color: "white",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(90, 120, 255, 0.14), transparent), radial-gradient(900px 500px at 80% 20%, rgba(255, 150, 90, 0.10), transparent), #0b0b0b",
      }}
    >
      <div style={{ minWidth: "1200px", maxWidth: "90vw", fontSize: "14px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 34, letterSpacing: -0.6 }}>Massey Job Tracking System</h1>
            <div style={{ marginTop: 6, opacity: 0.8 }}>Filter by search:
            </div>
          </div>
          <a
            href="/api/export/csv"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            Export CSV
          </a>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company / title / location / shift…"
            style={{
              padding: 10,
              width: 380,
              maxWidth: "100%",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              outline: "none",
            }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              outline: "none",
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s} style={{ color: "black" }}>
                {s ? s : "All statuses"}
              </option>
            ))}
          </select>

          <div style={{ marginLeft: "auto", opacity: 0.75, fontSize: 13 }}>
            {filtered.length} shown / {rows.length} total
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            overflowX: "auto",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                {[
                  "Company",
                  "Position",
                  "Location",
                  "Pay",
                  "Shift",
                  "Description",
                  "Status",
                  "Applied",
                  "Notes",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "center",
                      padding: 12,
                      position: "sticky",
                      top: 0,
                      background: "rgba(15,15,15,0.95)",
                      backdropFilter: "blur(10px)",
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                      fontSize: 12,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      opacity: 0.85,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    background: idx % 2 ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.1)", textAlign: "center",
                  }}
                >
                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontWeight: 700 }}>{r.companyName}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{r.source}</div>
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontWeight: 650 }}>{r.positionTitle}</div>
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ maxWidth: 260 }}>{r.location}</div>
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    ${fmtPay(r) || <span style={{ opacity: 0.6 }}>—</span>}
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ maxWidth: 200 }}>{r.shift || <span style={{ opacity: 0.6 }}>—</span>}</div>
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <button
                      onClick={() => {
                        setSelected(r);
                        setNotesDraft(r.notes ?? "");
                      }}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  </td>

                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <select
                      value={r.status}
                      onChange={async (e) => {
                        const next = e.target.value;
                        // optimistic UI
                        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
                        try {
                          await patchRow(r.id, { status: next });
                        } catch (err) {
                          console.error(err);
                          // revert on error
                          setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
                          alert("Failed to update status");
                        }
                      }}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      {[
                        { value: "Interested", label: "Interested" },
                        { value: "Applied", label: "Applied" },
                        { value: "FollowUp", label: "Follow-up needed" },
                        { value: "Interview", label: "Interview" },
                        { value: "Offer", label: "Offer" },
                        { value: "Rejected", label: "Rejected" },
                      ].map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ color: "black" }}>
                          {opt.label}
                        </option>
                      ))}


                    </select>
                  </td>


                  <td style={{ padding: 12, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
                    {r.dateApplied ? new Date(r.dateApplied).toLocaleDateString() : <span style={{ opacity: 0.6 }}>—</span>}
                  </td>


                  {/* NOTES column */}
                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {r.notes?.trim()
                      ? (
                        <div
                          title={r.notes}
                          style={{
                            maxWidth: 220,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            opacity: 0.9,
                            fontSize: "11px",
                          }}
                        >
                          {r.notes}
                        </div>
                      )
                      : <span style={{ opacity: 0.6 }}>—</span>}
                  </td>

                  {/* ACTION column */}
                  <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <a
                        href={r.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "white",
                          textDecoration: "none",
                          padding: "7px 10px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          display: "inline-block",
                        }}
                      >
                        Open
                      </a>

                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${r.companyName} — ${r.positionTitle}"?`)) return;
                          try {
                            await deleteRow(r.id);
                          } catch (e) {
                            console.error(e);
                            alert("Failed to delete");
                          }
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,80,80,0.12)",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>


                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td style={{ padding: 14 }} colSpan={10}>
                    Such emptiness....
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.companyName} — ${selected.positionTitle}` : ""}
      >
        {selected && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, opacity: 0.85 }}>
              <div><b>Location:</b> {selected.location || "—"}</div>
              <div><b>Pay:</b> {fmtPay(selected) || "—"}</div>
              <div><b>Shift:</b> {selected.shift || "—"}</div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 800 }}>Job description</div>
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 0 }}>Job description</div>
                  <div style={{ maxHeight: 300, overflow: "auto", paddingRight: 6 }}>
                    {renderJobDescription(selected.jobDescription ?? "")}
                  </div>
                </div>


              </div>
              <div><b>Status:</b> {selected.status}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800 }}>Notes</div>

              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add notes / follow-up reminders…"
                style={{
                  width: "100%",
                  minHeight: 120,
                  resize: "vertical",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                  lineHeight: 1.5,
                }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={async () => {
                    if (!selected) return;
                    try {
                      await patchRow(selected.id, { notes: notesDraft });
                    } catch (e) {
                      console.error(e);
                      alert("Failed to save notes");
                    }
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Save notes
                </button>
              </div>
            </div>


            <div>
              <a
                href={selected.jobUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "white",
                  textDecoration: "none",
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  display: "inline-block",
                }}
              >
                Open posting ↗
              </a>
            </div>
          </div>
        )}
      </Modal>
    </main >
  );
}
