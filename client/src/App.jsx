import { useEffect, useState, useCallback } from "react";
import { api } from "./api";

const INSTITUTE = "Appex Institute",
  CC = "91";
const inr = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const fd = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const today = () => new Date().toISOString().slice(0, 10);
const num = (n) => {
  let d = String(n || "").replace(/\D/g, "");
  return d.length === 10 ? CC + d : d;
};
const waLink = (s, text) =>
  `https://wa.me/${num(s.whatsapp || s.mobile)}?text=${encodeURIComponent(text)}`;
const reminder = (s) =>
  `Hello ${s.name}, this is a gentle reminder from ${INSTITUTE}. Fees of ${inr(s.monthDue || s.pending)} for ${s.course || "your course"} is due. Total pending: ${inr(s.pending)}. Thank you.`;
const FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["paid", "Paid"],
  ["month", "Due this month"],
  ["ending", "Ending in 30 days"],
];
const EMPTY = {
  name: "",
  mobile: "",
  whatsapp: "",
  course: "",
  admissionDate: today(),
  completionDate: "",
  totalFee: "",
  advance: "",
  monthlyInstallment: "",
  dueDay: 5,
  note: "",
};

export default function App() {
  const [list, setList] = useState([]),
    [sum, setSum] = useState({}),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("all");
  const [form, setForm] = useState(null),
    [payFor, setPayFor] = useState(null),
    [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        api.list({ q, filter }),
        api.summary(),
      ]);
      setList(l);
      setSum(s);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }, [q, filter]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const refreshPay = async (fn) => {
    const s = await fn();
    setPayFor(s);
    load();
    return s;
  };
  const remove = async (s) => {
    if (confirm(`Delete ${s.name} and all payments?`)) {
      await api.remove(s._id);
      load();
    }
  };

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>{INSTITUTE} · Fees</h1>
          <div className="mute">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <button className="btn p" onClick={() => setForm(EMPTY)}>
          + Add student
        </button>
      </header>
      {err && <div className="err">{err}</div>}
      <section className="stats">
        <div className="stat hero">
          <b>{inr(sum.monthPending)}</b>
          <span>Pending this month</span>
        </div>
        <div className="stat">
          <b className="pend">{inr(sum.pending)}</b>
          <span>Total pending</span>
        </div>
        <div className="stat">
          <b className="paid">{inr(sum.paid)}</b>
          <span>Total paid</span>
        </div>
        <div className="stat">
          <b>{inr(sum.monthCollected)}</b>
          <span>Collected this month</span>
        </div>
        <div className="stat">
          <b>{inr(sum.advance)}</b>
          <span>Advance received</span>
        </div>
        <div className="stat">
          <b>{sum.students || 0}</b>
          <span>Students</span>
        </div>
      </section>
      <input
        type="search"
        placeholder="Search name, mobile or course"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="tabs">
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            className="tab"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">
          No students found. Tap “Add student” to start.
        </div>
      )}
      {list.map((s) => (
        <article className="row" key={s._id}>
          <div>
            <h3>{s.name}</h3>
            <div className="mute">
              {s.course || "No course"} · {s.mobile}
            </div>
            <div className="mute">
              Admitted {fd(s.admissionDate)} · Completes {fd(s.completionDate)}
            </div>
            {s.totalFee > 0 && s.pending === 0 && (
              <span className="tag g">Fully paid</span>
            )}
            {s.monthDue > 0 && (
              <span className="tag w">Due {inr(s.monthDue)}</span>
            )}
            {s.daysLeft !== null && s.daysLeft < 0 && s.pending > 0 && (
              <span className="tag r">Course ended, fees pending</span>
            )}
            {s.daysLeft !== null && s.daysLeft >= 0 && s.daysLeft <= 30 && (
              <span className="tag">Ends in {s.daysLeft} days</span>
            )}
          </div>
          <div className="amt">
            <b className={s.pending ? "pend" : "paid"}>{inr(s.pending)}</b>
            <span className="mute">pending of {inr(s.totalFee)}</span>
            <span className="mute">
              Paid {inr(s.paid)} (advance {inr(s.advance)})
            </span>
          </div>
          <div className="prog">
            <i
              style={{
                width: `${s.totalFee ? Math.min(100, (s.paid / s.totalFee) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="acts">
            <button className="btn s p" onClick={() => setPayFor(s)}>
              + Payment
            </button>
            {s.pending > 0 && (
              <a
                className="btn s wa"
                target="_blank"
                rel="noreferrer"
                href={waLink(s, reminder(s))}>
                WhatsApp reminder
              </a>
            )}
            <a className="btn s" href={`tel:${s.mobile}`}>
              Call
            </a>
            <button
              className="btn s"
              onClick={() =>
                setForm({
                  ...s,
                  admissionDate: iso(s.admissionDate),
                  completionDate: iso(s.completionDate),
                })
              }>
              Edit
            </button>
            <button className="btn s d" onClick={() => remove(s)}>
              Delete
            </button>
          </div>
        </article>
      ))}

      {form && (
        <StudentForm
          init={form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}
      {payFor && (
        <PaymentModal
          s={payFor}
          onClose={() => setPayFor(null)}
          onAdd={(p) => refreshPay(() => api.pay(payFor._id, p))}
          onDel={(pid) => refreshPay(() => api.delPay(payFor._id, pid))}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="back"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function StudentForm({ init, onClose, onSaved }) {
  const [f, setF] = useState(init),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const F = (k, label, type = "text", extra = {}) => (
    <label>
      {label}
      <input type={type} value={f[k] ?? ""} onChange={set(k)} {...extra} />
    </label>
  );
  const submit = async () => {
    if (!f.name.trim() || !f.mobile.trim())
      return setErr("Name and mobile are required.");
    setBusy(true);
    try {
      await api.save({
        ...f,
        totalFee: +f.totalFee || 0,
        advance: +f.advance || 0,
        monthlyInstallment: +f.monthlyInstallment || 0,
        dueDay: +f.dueDay || 5,
      });
      onSaved();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <Modal title={f._id ? "Edit student" : "Add student"} onClose={onClose}>
      <div className="g2">
        {F("name", "Name")}
        {F("mobile", "Mobile", "tel")}
      </div>
      <div className="g2">
        {F("whatsapp", "WhatsApp (if different)", "tel")}
        {F("course", "Course")}
      </div>
      <div className="g2">
        {F("admissionDate", "Admission date", "date")}
        {F("completionDate", "Course completion date", "date")}
      </div>
      <div className="g2">
        {F("totalFee", "Total fee (₹)", "number")}
        {F("advance", "Advance paid (₹)", "number")}
      </div>
      <div className="g2">
        {F("monthlyInstallment", "Monthly installment (₹)", "number")}
        {F("dueDay", "Due day of month", "number", { min: 1, max: 28 })}
      </div>
      <label>
        Notes
        <textarea rows="2" value={f.note || ""} onChange={set("note")} />
      </label>
      {err && <div className="err">{err}</div>}
      <div className="end">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn p" disabled={busy} onClick={submit}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function PaymentModal({ s, onClose, onAdd, onDel }) {
  const [amount, setAmount] = useState(s.monthDue || s.pending || ""),
    [date, setDate] = useState(today()),
    [mode, setMode] = useState("Cash"),
    [err, setErr] = useState("");
  const add = async () => {
    if (!(+amount > 0)) return setErr("Enter a valid amount.");
    try {
      const u = await onAdd({ amount: +amount, date, mode });
      setAmount("");
      if (confirm("Payment saved. Send WhatsApp receipt?"))
        window.open(
          waLink(
            u,
            `Hello ${u.name}, we received ${inr(+amount)} towards fees on ${fd(date)}. Total paid ${inr(u.paid)}, pending ${inr(u.pending)}. Thank you! – ${INSTITUTE}`,
          ),
          "_blank",
        );
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title={`${s.name} · pending ${inr(s.pending)}`} onClose={onClose}>
      <div className="g2">
        <label>
          Amount (₹)
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <label>
        Mode
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {["Cash", "UPI", "Bank transfer", "Cheque"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      {err && <div className="err">{err}</div>}
      <div className="hist">
        {s.advance > 0 && (
          <div>
            <span>Advance</span>
            <span>{inr(s.advance)}</span>
          </div>
        )}
        {[...s.payments].reverse().map((p) => (
          <div key={p._id}>
            <span>
              {fd(p.date)} · {p.mode}
            </span>
            <span>
              {inr(p.amount)}{" "}
              <button className="btn s d" onClick={() => onDel(p._id)}>
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
      <div className="end">
        <button className="btn" onClick={onClose}>
          Close
        </button>
        <button className="btn p" onClick={add}>
          Save payment
        </button>
      </div>
    </Modal>
  );
}
