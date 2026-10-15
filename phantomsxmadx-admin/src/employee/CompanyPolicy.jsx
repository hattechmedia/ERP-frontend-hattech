import React, { useRef, useState, useEffect } from "react";
import {
  FiShield,
  FiClock,
  FiCalendar,
  FiFileText,
  FiLock,
  FiCheckCircle,
  FiPrinter,
  FiAward,
  FiAlertTriangle,
  FiUserCheck
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import api from "../services/api";

export default function CompanyPolicy() {
  const policyRef = useRef();
  const [customPolicy, setCustomPolicy] = useState(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get('/hr/config/company_policy');
        if (res.data?.success && res.data?.data?.value) {
          setCustomPolicy(res.data.data.value);
        }
      } catch (err) {
        // Fallback to static markup
      }
    };
    fetchPolicy();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: policyRef,
    documentTitle: "HAT_Tech_Media_Employee_Policy_and_Conduct",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4 pb-16 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-2xl shadow-inner">
            <FiShield />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Employee Policy & Code of Conduct
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              HAT Tech Media • Internal Governance & Professional Guidelines (2026)
            </p>
          </div>
        </div>

        <button
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <FiPrinter size={15} /> Print / Save PDF
        </button>
      </div>

      {/* DOCUMENT CONTENT */}
      <div
        ref={policyRef}
        className="p-6 md:p-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-8 print:p-8 print:bg-white print:text-black print:border-none print:shadow-none"
      >
        {/* DOCUMENT TITLE HEADER */}
        <div className="text-center border-b border-[var(--border-color)] pb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-black uppercase tracking-widest mb-2">
            Official Governance Document
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] print:text-black">
            EMPLOYEE POLICY & CONDUCT
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">
            Confidential Internal Policy Document | HAT Tech Media | All Rights Reserved © 2026
          </p>
        </div>

        {/* SECTION 1: PROBATIONARY PERIOD */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-3">
            <FiClock className="text-blue-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              1. Probationary Period
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                Duration & Status
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>All new graduated employees with no practical knowledge will serve a <strong>60-Day (2-Month)</strong> probationary period from the date of joining.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Probation is an <strong>unpaid evaluation period</strong> used to evaluate attendance, conduct, skills, and task quality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Good performance during probation leads to full benefits and advanced training opportunities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Probation outcome is totally based on performance, productivity, and verified results.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Employee of the month opportunity is totally based on results no matter whether on probation or salaried.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Employees are eligible for an experience letter after completing a minimum of <strong>six (6) months</strong> of employment.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                Leave During Probation
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>No paid leave</strong> is available during the probationary period.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>In a genuine emergency, Unpaid Leave (LWP) may be granted solely at Management's discretion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Repeated tardiness or absence during probation may result in immediate contract termination.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Leaves taken during probation (if urgent) will be calculated from the annual leave system.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Probation completion plays a critical role in transitioning to a salaried permanent employee.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: OFFICE HOURS & ATTENDANCE */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-3">
            <FiClock className="text-indigo-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              2. Office Hours & Attendance (Employees & Interns)
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Official working hours are <strong>12:00 PM – 8:00 PM (PKT)</strong>, totaling 8 hours inclusive of prayer times and one designated tea break.
          </p>

          <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-inner)] border-b border-[var(--border-color)]">
                  <th className="p-3 font-black uppercase tracking-wider text-blue-400">Scenario</th>
                  <th className="p-3 font-black uppercase tracking-wider text-[var(--text-primary)]">Rule</th>
                  <th className="p-3 font-black uppercase tracking-wider text-amber-400">Consequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Arrival by 12:00 PM</td>
                  <td className="p-3">Required (Mandatory)</td>
                  <td className="p-3 text-emerald-400 font-bold">Compliant — No action</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Arrival 12:01 – 12:30 PM</td>
                  <td className="p-3">Grace period allowed</td>
                  <td className="p-3 text-blue-400 font-bold">No deduction</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Arrival 12:30 – 1:00 PM</td>
                  <td className="p-3">Counted as Late Mark</td>
                  <td className="p-3 text-amber-400 font-bold">3 Lates = 1 Day Deducted</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Arrival 1:00 – 2:00 PM</td>
                  <td className="p-3">Without valid reason</td>
                  <td className="p-3 text-orange-400 font-bold">Half-Day marked</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Arrival after 2:00 PM</td>
                  <td className="p-3">Without valid reason</td>
                  <td className="p-3 text-red-400 font-bold">Absent marked</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">5 Late Marks in a month</td>
                  <td className="p-3">Escalated offence</td>
                  <td className="p-3 text-red-500 font-bold">2 Days Absent deduction</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Uninformed Absence</td>
                  <td className="p-3">No prior notice given</td>
                  <td className="p-3 text-red-500 font-bold">1 Full Day Salary Deducted</td>
                </tr>
                <tr className="hover:bg-white/5 transition">
                  <td className="p-3 font-bold text-[var(--text-primary)]">Late/Absent with Notice</td>
                  <td className="p-3">Inform manager 1 day prior</td>
                  <td className="p-3 text-blue-400 font-bold">Leave deducted per policy</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1 text-xs text-[var(--text-secondary)]">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Employees must check in and be present or online by <strong>12:00 PM sharp</strong>.
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              One (1) Half-Day per month is permitted; further instances will be deducted from the annual leave balance.
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              All Gazetted Public Holidays declared by the Government of Pakistan shall be observed.
            </p>
          </div>
        </section>

        {/* SECTION 3: LEAVE ENTITLEMENTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-purple-500 pl-3">
            <FiCalendar className="text-purple-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              3. Leave Entitlements & Policy (Employees & Interns)
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Leave is managed on an Annual Calendar basis (January – December). Leaves are accrued at approximately <strong>3 days per month</strong> of service and cannot be consumed in bulk at the start of the year.
          </p>

          <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-inner)] border-b border-[var(--border-color)]">
                  <th className="p-3 font-black uppercase tracking-wider text-purple-400">Leave Type</th>
                  <th className="p-3 font-black uppercase tracking-wider text-[var(--text-primary)]">Quota / Year</th>
                  <th className="p-3 font-black uppercase tracking-wider text-blue-400">Notice Required</th>
                  <th className="p-3 font-black uppercase tracking-wider text-emerald-400">Carry Forward</th>
                  <th className="p-3 font-black uppercase tracking-wider text-amber-400">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                <tr>
                  <td className="p-3 font-bold text-[var(--text-primary)]">Annual (Privilege) Leave</td>
                  <td className="p-3 font-bold">14 Days</td>
                  <td className="p-3">7 Days in advance</td>
                  <td className="p-3 text-emerald-400 font-bold">Up to 14 days</td>
                  <td className="p-3 text-emerald-400 font-bold">No (carried)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--text-primary)]">Casual Leave</td>
                  <td className="p-3 font-bold">10 Days</td>
                  <td className="p-3">24 Hours prior</td>
                  <td className="p-3 text-red-400 font-bold">Not allowed</td>
                  <td className="p-3 text-amber-400 font-bold">Dec 31</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[var(--text-primary)]">Sick Leave</td>
                  <td className="p-3 font-bold">12 Days</td>
                  <td className="p-3">By 10:00 AM same day</td>
                  <td className="p-3 text-red-400 font-bold">Not allowed</td>
                  <td className="p-3 text-amber-400 font-bold">Dec 31</td>
                </tr>
                <tr className="bg-purple-500/10 font-bold text-[var(--text-primary)]">
                  <td className="p-3 uppercase">TOTAL PAID LEAVES</td>
                  <td className="p-3 text-purple-400 text-sm">36 Days</td>
                  <td className="p-3">—</td>
                  <td className="p-3">—</td>
                  <td className="p-3">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
            <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">
              Special Leave Rules & Mandatory Directives
            </h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Medical Certificate:</strong> Sick leave exceeding 2 consecutive days requires a valid medical certificate from a registered practitioner, submitted upon return.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Sandwich Rule:</strong> If a Public Holiday falls adjacent to a weekend and the Employee takes connected leave, intervening days count as leave unless pre-approved 10 days in advance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>No-Leave Zone:</strong> Management may freeze or decline any leave request (except medical emergencies) during critical project deployments, client crunch periods, or sudden technical emergencies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Notice Period:</strong> No leave of any kind may be taken or adjusted during the 30-day notice period.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>Casual and Sick leave balances expire on December 31st and cannot be encashed or carried forward.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Leave Approval Authority:</strong> All leave requests must first be approved by <strong>HR Director, Maam Ramsha</strong>. A leave will only be considered valid once formally approved; otherwise, the absence will be marked as unapproved.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>If you have 3 paid leaves available per month, <strong>any leave taken without prior approval will be marked as absent</strong>, regardless of your remaining leave balance.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 4: PROFESSIONAL CONDUCT & DISCIPLINE */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-3">
            <FiShield className="text-amber-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              4. Professional Conduct & Discipline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Required Workplace Standards
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Zero tolerance</strong> for harassment, gossip, bullying, insubordination, or toxic behavior in any form.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Personal phone calls must be limited to designated breaks only. Sleeping during office hours is strictly prohibited.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Employees must follow all official instructions and directives from their assigned direct manager and project heads.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Company assets, internal work records, and client information must never be displayed or shared with unauthorized outsiders.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Work Outsourcing & Compliance
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Work Outsourcing:</strong> If an employee hands over any company project to an external agency, this decision rests entirely with company management — the employee has no authority to do so independently.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Any act of fraud, intentional misrepresentation, or willful breach of company policies constitutes grounds for immediate termination.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Breaches must be rectified within 30 days of written notice by the Board of Directors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Employees must complete a minimum employment period of <strong>six (6) months</strong> to be eligible for an official Experience Letter.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5: DATA MANAGEMENT & EQUIPMENT SECURITY */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-3">
            <FiLock className="text-emerald-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              5. Data Management, IP & Equipment Security
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Data Handling & Intellectual Property
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Client data, passwords, project files, credentials, and business strategies are strictly confidential and must never be shared outside the company.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>All files must be stored only on Company-approved storage systems and official repositories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Use strong, unique passwords for all company accounts. Do not reuse personal passwords.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>All intellectual property — code, designs, architectures, documents, and creative work — produced during employment belongs exclusively to <strong>HAT Tech Media</strong>.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Equipment & Off-boarding
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Company equipment is for official work purposes only. Unauthorized personal use is not permitted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Report any hardware or system damage to HR immediately. The employee is liable for damages caused by willful negligence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Upon resignation or termination, the employee must return all company equipment, revoke client access, and delete company data from personal devices within <strong>48 hours</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Failure to comply with off-boarding obligations may result in formal legal proceedings.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 6: TERMINATION & NOTICE PERIOD */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-3">
            <FiAlertTriangle className="text-rose-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              6. Termination, Notice Period & Exit Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">
                Voluntary Resignation
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>A written notice of a minimum <strong>Thirty (30) days</strong> is mandatory prior to resignation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>The entire notice period must be served actively — performing duties, completing project handover, and transferring knowledge to successors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>No leave may be taken or adjusted during the notice period. Unapproved absence will result in salary deductions.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">
                Termination by the Company
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>The Company may terminate employment at any time for Cause, including fraud, data breach, willful misrepresentation, or gross misconduct.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Immediate termination (without notice pay)</strong> is enforced for: data leaks, repeated policy violations, harassment, or duty abandonment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Where a breach is remediable, the Employee will be given Thirty (30) days written notice to cure the breach.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 7: INTERNSHIP CERTIFICATION & WORK REPORTING */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-l-4 border-cyan-500 pl-3">
            <FiAward className="text-cyan-500" size={20} />
            <h3 className="text-lg font-black uppercase tracking-wide text-[var(--text-primary)] print:text-black">
              7. Internship Certification & Evaluation Policy
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                Internship Duration & Certification
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Air University Interns:</strong> Duration will be <strong>2 months</strong>, subject to successfully passing the Internship Evaluation Test.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Other University Interns:</strong> Duration will be <strong>3 months</strong>, subject to successfully passing the Internship Evaluation Test.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Job Opportunity:</strong> Interns demonstrating strong performance, professional behavior, and good conduct may be considered for job interviews upon completion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Completion Certificate:</strong> Issued only to interns who successfully complete the full assigned duration. Interns leaving early (even after completing half) are not eligible for a certificate or completion letter.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-2">
              <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                Work Reporting & Review
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Daily work and progress must be submitted daily through the portal and communicated via the assigned Team Lead.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Individuals should not visit the executive office daily or directly present their daily work to the executive management without Team Lead coordination.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Individual performance and work milestones will be reviewed during the weekly weekend meeting.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 8: EXECUTIVE SIGNATURES */}
        <section className="pt-8 border-t border-[var(--border-color)] space-y-6">
          <h4 className="text-center text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
            Executive Authorization & Board of Directors
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-3">
              <div className="h-14 flex items-center justify-center font-serif text-lg italic text-blue-400 border-b border-dashed border-[var(--border-color)] pb-2">
                Ramsha Rashid
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">Ramsha Rashid</p>
                <p className="text-[10px] uppercase font-bold text-blue-400">Director Admin & HR</p>
                <p className="text-[9px] text-[var(--text-secondary)]">HAT Tech Media</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-3">
              <div className="h-14 flex items-center justify-center font-serif text-lg italic text-blue-400 border-b border-dashed border-[var(--border-color)] pb-2">
                Rana Awais Ahmad
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">Awais Ahmad</p>
                <p className="text-[10px] uppercase font-bold text-blue-400">CTO & Co-Founder</p>
                <p className="text-[9px] text-[var(--text-secondary)]">HAT Tech Media</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-inner)] border border-[var(--border-color)] space-y-3">
              <div className="h-14 flex items-center justify-center font-serif text-lg italic text-blue-400 border-b border-dashed border-[var(--border-color)] pb-2">
                Wajeeha Amin
              </div>
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">Wajeeha Amin</p>
                <p className="text-[10px] uppercase font-bold text-blue-400">Sales & Growth Director</p>
                <p className="text-[9px] text-[var(--text-secondary)]">HAT Tech Media</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              HAT Tech Media — Confidential Internal Policy Document | All Rights Reserved © 2026
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
