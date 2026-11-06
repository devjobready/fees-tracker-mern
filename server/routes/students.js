const router = require('express').Router();
const Student = require('../models/Student');
const wrap = fn => (req, res) => fn(req, res).catch(e =>
  res.status(e.name === 'ValidationError' || e.name === 'CastError' ? 400 : 500).json({ message: e.message }));
const notFound = res => res.status(404).json({ message: 'Student not found' });

router.get('/summary', wrap(async (req, res) => {
  const t = { students: 0, pending: 0, paid: 0, advance: 0, monthPending: 0, monthCollected: 0 };
  (await Student.find()).forEach(s => {
    t.students++; t.pending += s.pending; t.paid += s.paid; t.advance += s.advance;
    t.monthPending += s.monthDue; t.monthCollected += s.monthPaid;
  });
  res.json(t);
}));

router.get('/', wrap(async (req, res) => {
  const { q, filter = 'all' } = req.query;
  const rx = q && new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  let list = await Student.find(rx ? { $or: ['name', 'mobile', 'course'].map(k => ({ [k]: rx })) } : {}).sort('name');
  const f = {
    pending: s => s.pending > 0,
    paid: s => s.totalFee > 0 && s.pending === 0,
    month: s => s.monthDue > 0,
    ending: s => s.daysLeft !== null && s.daysLeft >= 0 && s.daysLeft <= 30
  }[filter];
  res.json(f ? list.filter(f) : list);
}));

router.post('/', wrap(async (req, res) => { const { payments, ...b } = req.body; res.status(201).json(await Student.create(b)); }));

router.put('/:id', wrap(async (req, res) => {
  const { payments, ...b } = req.body;
  const s = await Student.findByIdAndUpdate(req.params.id, b, { new: true, runValidators: true });
  s ? res.json(s) : notFound(res);
}));

router.delete('/:id', wrap(async (req, res) => {
  (await Student.findByIdAndDelete(req.params.id)) ? res.json({ ok: true }) : notFound(res);
}));

router.post('/:id/payments', wrap(async (req, res) => {
  const s = await Student.findById(req.params.id); if (!s) return notFound(res);
  s.payments.push(req.body); await s.save(); res.status(201).json(s);
}));

router.delete('/:id/payments/:pid', wrap(async (req, res) => {
  const s = await Student.findById(req.params.id); if (!s) return notFound(res);
  s.payments.pull(req.params.pid); await s.save(); res.json(s);
}));
module.exports = router;
