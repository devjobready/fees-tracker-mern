const B = (import.meta.env.VITE_API_URL || '') + '/api/students', H = { 'Content-Type': 'application/json' };
const j = async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Request failed'); return r.json(); };
const send = (url, method, body) => fetch(url, { method, headers: H, body: body && JSON.stringify(body) }).then(j);
export const api = {
  list: p => fetch(`${B}?${new URLSearchParams(p)}`).then(j),
  summary: () => fetch(`${B}/summary`).then(j),
  save: s => send(s._id ? `${B}/${s._id}` : B, s._id ? 'PUT' : 'POST', s),
  remove: id => send(`${B}/${id}`, 'DELETE'),
  pay: (id, p) => send(`${B}/${id}/payments`, 'POST', p),
  delPay: (id, pid) => send(`${B}/${id}/payments/${pid}`, 'DELETE')
};