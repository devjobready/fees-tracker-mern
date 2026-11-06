const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now },
  mode: { type: String, enum: ['Cash', 'UPI', 'Bank transfer', 'Cheque'], default: 'Cash' }
});
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true },
  course: { type: String, trim: true },
  admissionDate: Date,
  completionDate: Date,
  totalFee: { type: Number, default: 0, min: 0 },
  advance: { type: Number, default: 0, min: 0 },
  monthlyInstallment: { type: Number, default: 0, min: 0 },
  dueDay: { type: Number, default: 5, min: 1, max: 28 },
  note: String,
  payments: [paymentSchema]
}, { timestamps: true, toJSON: { virtuals: true }, id: false });

const sameMonth = d => { const n = new Date(), x = new Date(d); return n.getFullYear() === x.getFullYear() && n.getMonth() === x.getMonth(); };
studentSchema.virtual('paid').get(function () { return this.advance + this.payments.reduce((a, p) => a + p.amount, 0); });
studentSchema.virtual('pending').get(function () { return Math.max(0, this.totalFee - this.paid); });
studentSchema.virtual('monthPaid').get(function () { return this.payments.filter(p => sameMonth(p.date)).reduce((a, p) => a + p.amount, 0); });
studentSchema.virtual('monthDue').get(function () {
  return Math.max(0, Math.min(this.pending, this.monthlyInstallment || this.pending) - this.monthPaid);
});
studentSchema.virtual('daysLeft').get(function () {
  return this.completionDate ? Math.ceil((this.completionDate - Date.now()) / 864e5) : null;
});
module.exports = mongoose.model('Student', studentSchema);
