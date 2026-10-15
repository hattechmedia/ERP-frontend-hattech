import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCalendar,
  FiFileText,
  FiLock,
  FiAward
} from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function PolicyAcceptanceModal({ isOpen, user, onAcceptSuccess }) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!agreed) {
      toast.error("You must read and tick the acknowledgment checkbox to proceed.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Recording policy acknowledgment...");
    try {
      const res = await api.post("/auth/accept-policy");
      if (res.data.success) {
        toast.success("Policy accepted! Welcome to HAT Tech Media Portal.", { id: toastId });
        // Update sessionStorage
        const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        const updated = {
          ...currentUser,
          policyAccepted: true,
          policyAcceptedAt: res.data.policyAcceptedAt || new Date().toISOString()
        };
        sessionStorage.setItem("currentUser", JSON.stringify(updated));
        if (onAcceptSuccess) {
          onAcceptSuccess(updated);
        }
      } else {
        toast.error(res.data.message || "Failed to record acceptance", { id: toastId });
      }
    } catch (err) {
      console.error("Policy acceptance error:", err);
      // Fallback: If network error or endpoint issue, update session locally so employee isn't blocked permanently
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const updated = { ...currentUser, policyAccepted: true, policyAcceptedAt: new Date().toISOString() };
      sessionStorage.setItem("currentUser", JSON.stringify(updated));
      toast.success("Policy acknowledged.", { id: toastId });
      if (onAcceptSuccess) onAcceptSuccess(updated);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#0f121d] border border-blue-500/30 text-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto flex flex-col max-h-[90vh]"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center gap-4 border-b border-white/10 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-2xl flex-shrink-0 shadow-inner">
              <FiShield />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  Mandatory Onboarding Requirement
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Company Policy & Code of Conduct
              </h2>
              <p className="text-xs text-gray-400">
                Please review and accept HAT Tech Media's internal policy before accessing the workspace.
              </p>
            </div>
          </div>

          {/* SCROLLABLE POLICY PREVIEW (EXACT 100% MATCH TO COMPANY POLICY PAGE) */}
          <div className="flex-1 overflow-y-auto py-5 pr-3 space-y-8 text-xs text-gray-300 leading-relaxed custom-scrollbar my-2 bg-black/40 p-4 sm:p-6 rounded-2xl border border-white/5">
            
            {/* DOCUMENT TITLE HEADER */}
            <div className="text-center border-b border-white/10 pb-5">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Official Governance Document
              </div>
              <h3 className="text-2xl font-black text-white">
                EMPLOYEE POLICY & CONDUCT
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Confidential Internal Policy Document | HAT Tech Media | All Rights Reserved © 2026
              </p>
            </div>

            {/* SECTION 1: PROBATIONARY PERIOD */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-blue-500 pl-3">
                <FiClock className="text-blue-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  1. Probationary Period
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-blue-400 tracking-wider">
                    Duration & Status
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>All new graduated employees with no practical knowledge will serve a <strong>60-Day (2-Month)</strong> probationary period from the date of joining.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Probation is an <strong>unpaid period</strong> used to evaluate attendance, conduct, skills, and task quality.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Good performance during probation leads to full benefits and advanced training opportunities.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Probation is totally based on performance and results.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Employee of the month opportunity is totally based on results no matter whether on probation or salaried.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Employees are eligible for an experience letter after completing a minimum of <strong>six (6) months</strong> of employment.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-blue-400 tracking-wider">
                    Leave During Probation
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>No paid leave</strong> is available during the probationary period.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>In a genuine emergency, Unpaid Leave (LWP) may be granted solely at Management's discretion.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>Repeated tardiness or absence during probation may result in immediate contract termination.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Leaves taken during probation (if urgent) will be calculated from the annual leave system.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>Probation plays a critical role in transitioning to a salaried permanent employee.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 2: OFFICE HOURS & ATTENDANCE */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-indigo-500 pl-3">
                <FiClock className="text-indigo-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  2. Office Hours & Attendance (Employees & Interns)
                </h4>
              </div>

              <p className="text-[11px] text-gray-300">
                Official working hours are <strong>12:00 PM – 8:00 PM (PKT)</strong>, total working 8 hours inclusive of prayer times and one tea break.
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-white">
                      <th className="p-2.5 font-black uppercase tracking-wider text-blue-400">Scenario</th>
                      <th className="p-2.5 font-black uppercase tracking-wider">Rule</th>
                      <th className="p-2.5 font-black uppercase tracking-wider text-amber-400">Consequence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    <tr>
                      <td className="p-2.5 font-bold text-white">Arrival by 12:00 PM</td>
                      <td className="p-2.5">Required (mandatory)</td>
                      <td className="p-2.5 text-emerald-400 font-bold">Compliant — no action</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Arrival 12:01–12:30 PM</td>
                      <td className="p-2.5">Grace period allowed</td>
                      <td className="p-2.5 text-blue-400 font-bold">No deduction</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Arrival 12:30–1:00 PM</td>
                      <td className="p-2.5">Counted as Late Mark</td>
                      <td className="p-2.5 text-amber-400 font-bold">3 lates = 1 day deducted</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Arrival 1:00–2:00 PM</td>
                      <td className="p-2.5">Without any valid Reason</td>
                      <td className="p-2.5 text-orange-400 font-bold">Half day</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Arrival after 2:00 PM</td>
                      <td className="p-2.5">Without any valid Reason</td>
                      <td className="p-2.5 text-red-400 font-bold">Absent</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">5 Late Marks in month</td>
                      <td className="p-2.5">Escalated offence</td>
                      <td className="p-2.5 text-red-400 font-bold">2 days Absent</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Uninformed Absence</td>
                      <td className="p-2.5">No prior notice given</td>
                      <td className="p-2.5 text-red-400 font-bold">1 full day salary deducted</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Late/Absent with Notice</td>
                      <td className="p-2.5">Inform manager 1 day prior</td>
                      <td className="p-2.5 text-blue-400 font-bold">Leave deducted per policy</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1 text-[11px] text-gray-300">
                <p>• Employees must check in and be present or online by <strong>12:00 PM sharp</strong>.</p>
                <p>• One (1) Half-Day per month is permitted; further instances will be deducted from the annual leave balance.</p>
                <p>• All Gazetted Public Holidays declared by the Government of Pakistan shall be observed.</p>
              </div>
            </section>

            {/* SECTION 3: LEAVE ENTITLEMENTS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-purple-500 pl-3">
                <FiCalendar className="text-purple-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  3. Leave Entitlements & Policy (Employees & Interns)
                </h4>
              </div>

              <p className="text-[11px] text-gray-300">
                Leave is managed on an Annual Calendar basis (January – December). Leaves are accrued at approximately <strong>3 days per month</strong> of service and cannot be consumed in bulk at the year's start.
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-white">
                      <th className="p-2.5 font-black uppercase tracking-wider text-purple-400">Leave Type</th>
                      <th className="p-2.5 font-black uppercase tracking-wider">Quota/Year</th>
                      <th className="p-2.5 font-black uppercase tracking-wider text-blue-400">Notice Required</th>
                      <th className="p-2.5 font-black uppercase tracking-wider text-emerald-400">Carry Forward</th>
                      <th className="p-2.5 font-black uppercase tracking-wider text-amber-400">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    <tr>
                      <td className="p-2.5 font-bold text-white">Annual (Privilege)</td>
                      <td className="p-2.5 font-bold">14 Days</td>
                      <td className="p-2.5">7 Days in advance</td>
                      <td className="p-2.5 text-emerald-400 font-bold">Up to 14 days</td>
                      <td className="p-2.5 text-emerald-400 font-bold">No (carried)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Casual Leave</td>
                      <td className="p-2.5 font-bold">10 Days</td>
                      <td className="p-2.5">24 Hours prior</td>
                      <td className="p-2.5 text-red-400 font-bold">Not allowed</td>
                      <td className="p-2.5 text-amber-400 font-bold">Dec 31</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Sick Leave</td>
                      <td className="p-2.5 font-bold">12 Days</td>
                      <td className="p-2.5">By 10:00 AM same day</td>
                      <td className="p-2.5 text-red-400 font-bold">Not allowed</td>
                      <td className="p-2.5 text-amber-400 font-bold">Dec 31</td>
                    </tr>
                    <tr className="bg-purple-500/10 font-bold text-white">
                      <td className="p-2.5 uppercase">TOTAL PAID LEAVES</td>
                      <td className="p-2.5 text-purple-400 font-bold">36 Days</td>
                      <td className="p-2.5">—</td>
                      <td className="p-2.5">—</td>
                      <td className="p-2.5">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-[11px] text-gray-300">
                <h5 className="text-[11px] font-black uppercase text-purple-400 tracking-wider mb-1">
                  Special Leave Rules
                </h5>
                <p>• <strong>Medical Certificate:</strong> Sick leave exceeding 2 consecutive days requires a valid certificate from a registered practitioner, submitted upon return.</p>
                <p>• <strong>Sandwich Rule:</strong> If a Public Holiday falls adjacent to a weekend and the Employee takes connected leave, intervening days count as leave unless pre-approved 10 days in advance.</p>
                <p>• <strong>No-Leave Zone:</strong> Management may freeze or decline any leave request (except medical emergencies) during critical project deployments, client crunch periods, or sudden technical emergencies.</p>
                <p>• <strong>Notice Period:</strong> No leave of any kind may be taken or adjusted during the 30-day notice period.</p>
                <p>• Casual and Sick leave balances expire on December 31st and cannot be encashed or carried forward.</p>
                <p>• <strong>Leave Approval:</strong> Leave request must first be approved by <strong>HR Director, Maam Ramsha</strong>. A leave will only be considered valid once it has been approved; otherwise, the absence will be marked as unapproved.</p>
                <p>• If you have 3 paid leaves available per month, <strong>any leave taken without prior approval will be marked as absent</strong>, regardless of your remaining leave balance.</p>
              </div>
            </section>

            {/* SECTION 4: PROFESSIONAL CONDUCT & DISCIPLINE */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-amber-500 pl-3">
                <FiShield className="text-amber-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  4. Professional Conduct & Discipline
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                    Required Standards
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong>Zero tolerance</strong> for harassment, gossip, bullying, or toxic behavior in any form.</li>
                    <li>• Personal phone calls must be limited to breaks only. No sleeping during office hours.</li>
                    <li>• Employees must follow all instructions and directives from their direct manager.</li>
                    <li>• Company assets, work records, and client information must never be displayed or shared with outsiders.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                    Work Outsourcing & Termination Grounds
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong>Work Outsourcing:</strong> If the Employee hands over any company project to an external agency, this decision rests entirely with company management — the Employee has no authority to do so independently.</li>
                    <li>• Any act of fraud, intentional misrepresentation, or willful breach of company policies constitutes grounds for immediate termination.</li>
                    <li>• Breach must be rectified within 30 days of written notice by the Board of Directors.</li>
                    <li>• Employees must complete a minimum employment period of <strong>six (6) months</strong> to be eligible for an Experience Letter.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 5: DATA MANAGEMENT & EQUIPMENT SECURITY */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-emerald-500 pl-3">
                <FiLock className="text-emerald-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  5. Data Management & Equipment Security
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                    Data Handling & IP
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• Client data, passwords, project files, and business strategies are strictly confidential and must never be shared outside the company.</li>
                    <li>• All files must be stored only in Company-approved storage systems and platforms.</li>
                    <li>• Use strong, unique passwords for all company accounts. Do not reuse personal passwords.</li>
                    <li>• All intellectual property — code, designs, documents, and creative work — produced during employment belongs exclusively to <strong>HAT Tech Media</strong>.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
                    Equipment & Off-boarding
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• Company equipment is for official work purposes only. Personal use is not permitted.</li>
                    <li>• Report any damage to equipment to HR immediately. The Employee is liable for damages caused by negligence.</li>
                    <li>• Upon resignation or termination, the Employee must return all company equipment, revoke all client access, and delete company data from personal devices within <strong>48 hours</strong>.</li>
                    <li>• Failure to comply with off-boarding obligations may result in legal proceedings.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 6: TERMINATION & NOTICE PERIOD */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-rose-500 pl-3">
                <FiAlertCircle className="text-rose-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  6. Termination, Notice Period & Exit Policy
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-rose-400 tracking-wider">
                    Voluntary Resignation
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• A written notice of minimum <strong>Thirty (30) days</strong> is mandatory prior to resignation.</li>
                    <li>• The entire notice period must be served actively — performing duties, completing handover, and transferring knowledge to successors.</li>
                    <li>• No leave may be taken or adjusted during the notice period. Absence during notice without approval will result in salary deductions.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-rose-400 tracking-wider">
                    Termination by the Company
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• The Company may terminate employment at any time for Cause, including criminal offence, fraud, data breach, willful misrepresentation, or gross misconduct.</li>
                    <li>• <strong>Immediate termination (without notice pay)</strong> is enforced for: data leaks, repeated rule-breaking, harassment, or abandonment of duties.</li>
                    <li>• Where a breach is remediable, the Employee will be given Thirty (30) days written notice to cure the breach.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 7: INTERNSHIP CERTIFICATION & WORK REPORTING */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 border-l-4 border-cyan-500 pl-3">
                <FiAward className="text-cyan-400" size={18} />
                <h4 className="text-sm font-black uppercase tracking-wide text-white">
                  7. Internship Certification & Evaluation Policy
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-cyan-400 tracking-wider">
                    Internship Duration & Certification
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• <strong>Air University Interns:</strong> Internship duration will be 2 months, subject to successfully passing the internship Evaluation Test.</li>
                    <li>• <strong>Other University Interns:</strong> Internship duration will be 3 months, subject to successfully passing the Internship Evaluation Test.</li>
                    <li>• <strong>Job Opportunity:</strong> Interns who demonstrate strong performance, professional behavior, and good conduct may be considered for job interview upon completion.</li>
                    <li>• <strong>Completion Certificate:</strong> Issued <strong>only</strong> to interns who successfully complete the full assigned internship duration. Interns who leave before completing the required duration (even after half) will not be eligible.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-black uppercase text-cyan-400 tracking-wider">
                    Work Reporting & Review
                  </h5>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>• Daily work and progress should be communicated through the Team Lead; individuals should not visit the office daily or directly present their work to the concerned Sir.</li>
                    <li>• Individual work and performance will be reviewed during the weekly weekend meeting.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 8: EXECUTIVE SIGNATURES */}
            <section className="pt-4 border-t border-white/10 space-y-3">
              <h5 className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                Executive Authorization & Board of Directors
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-10 flex items-center justify-center font-serif text-sm italic text-blue-400 border-b border-dashed border-white/10 pb-1">
                    Ramsha Rashid
                  </div>
                  <p className="font-bold text-xs text-white mt-1.5">Ramsha Rashid</p>
                  <p className="text-[9px] uppercase font-bold text-blue-400">Director Admin - HAT Tech Media</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-10 flex items-center justify-center font-serif text-sm italic text-blue-400 border-b border-dashed border-white/10 pb-1">
                    Rana Awais Ahmad
                  </div>
                  <p className="font-bold text-xs text-white mt-1.5">Awais Ahmad</p>
                  <p className="text-[9px] uppercase font-bold text-blue-400">CTO - HAT Tech Media</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-10 flex items-center justify-center font-serif text-sm italic text-blue-400 border-b border-dashed border-white/10 pb-1">
                    Wajeeha Amin
                  </div>
                  <p className="font-bold text-xs text-white mt-1.5">Wajeeha Amin</p>
                  <p className="text-[9px] uppercase font-bold text-blue-400">Sales Director - HAT Tech Media</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                  HAT Tech Media — Confidential Internal Policy Document | All Rights Reserved © 2026
                </p>
              </div>
            </section>
          </div>

          {/* ACKNOWLEDGMENT CHECKBOX & ACTION */}
          <div className="border-t border-white/10 pt-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-2xl hover:bg-blue-500/15 transition">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-200 font-medium leading-relaxed">
                I, <strong>{user?.name || user?.username || "Employee"}</strong>, hereby acknowledge that I have read, understood, and agreed to abide by all the terms, policies, attendance rules, leave protocols, and code of conduct set forth by <strong>HAT Tech Media</strong>.
              </span>
            </label>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-gray-500">
                Authorized by Board of Directors • © 2026 HAT Tech Media
              </p>
              <button
                onClick={handleAccept}
                disabled={!agreed || submitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer ${
                  agreed && !submitting
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30 scale-[1.02]"
                    : "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed opacity-60"
                }`}
              >
                <FiCheckCircle size={16} />
                {submitting ? "Processing..." : "I Accept & Proceed to Workspace"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
