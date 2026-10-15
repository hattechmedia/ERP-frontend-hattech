import React, { useState, useEffect, useRef } from "react";
import {
  FiShield,
  FiFileText,
  FiBell,
  FiPrinter,
  FiEdit3,
  FiCheck,
  FiTrash2,
  FiPlus,
  FiClock,
  FiCalendar,
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSave,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiAward,
  FiLock
} from "react-icons/fi";
import { useReactToPrint } from "react-to-print";
import api from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_FULL_POLICY = {
  title: "EMPLOYEE POLICY & CONDUCT",
  subtitle: "Confidential Internal Policy Document | HAT Tech Media | All Rights Reserved © 2026",
  version: "2026.1",
  officeHours: "12:00 PM – 8:00 PM (PKT)",
  sections: [
    {
      id: "probation",
      title: "1. Probationary Period",
      description: "Evaluation terms and status for newly onboarded staff and fresh graduates.",
      blocks: [
        {
          title: "Duration & Status",
          points: [
            "All new graduated employees with no practical knowledge will serve a 60-Day (2-Month) probationary period from the date of joining.",
            "Probation is an unpaid evaluation period used to evaluate attendance, conduct, skills, and task quality.",
            "Good performance during probation leads to full benefits and advanced training opportunities.",
            "Probation outcome is totally based on performance, productivity, and verified results.",
            "Employee of the month opportunity is totally based on results no matter whether on probation or salaried.",
            "Employees are eligible for an experience letter after completing a minimum of six (6) months of employment."
          ]
        },
        {
          title: "Leave During Probation",
          points: [
            "No paid leave is available during the probationary period.",
            "In a genuine emergency, Unpaid Leave (LWP) may be granted solely at Management's discretion.",
            "Repeated tardiness or absence during probation may result in immediate contract termination.",
            "Leaves taken during probation (if urgent) will be calculated from the annual leave system.",
            "Probation completion plays a critical role in transitioning to a salaried permanent employee."
          ]
        }
      ]
    },
    {
      id: "attendance",
      title: "2. Office Hours & Attendance (Employees & Interns)",
      description: "Official working hours are 12:00 PM – 8:00 PM (PKT), totaling 8 hours inclusive of prayer times and one designated tea break.",
      rulesTable: [
        { scenario: "Arrival by 12:00 PM", rule: "Required (Mandatory)", consequence: "Compliant — No action" },
        { scenario: "Arrival 12:01 – 12:30 PM", rule: "Grace period allowed", consequence: "No deduction" },
        { scenario: "Arrival 12:30 – 1:00 PM", rule: "Counted as Late Mark", consequence: "3 Lates = 1 Day Deducted" },
        { scenario: "Arrival 1:00 – 2:00 PM", rule: "Without valid reason", consequence: "Half-Day marked" },
        { scenario: "Arrival after 2:00 PM", rule: "Without valid reason", consequence: "Absent marked" },
        { scenario: "5 Late Marks in a month", rule: "Escalated offence", consequence: "2 Days Absent deduction" },
        { scenario: "Uninformed Absence", rule: "No prior notice given", consequence: "1 Full Day Salary Deducted" },
        { scenario: "Late/Absent with Notice", rule: "Inform manager 1 day prior", consequence: "Leave deducted per policy" }
      ],
      points: [
        "Employees must check in and be present or online by 12:00 PM sharp.",
        "One (1) Half-Day per month is permitted; further instances will be deducted from the annual leave balance.",
        "All Gazetted Public Holidays declared by the Government of Pakistan shall be observed."
      ]
    },
    {
      id: "leaves",
      title: "3. Leave Entitlements & Policy (Employees & Interns)",
      description: "Leave is managed on an Annual Calendar basis (January – December). Leaves are accrued at approximately 3 days per month of service and cannot be consumed in bulk at the start of the year.",
      leavesTable: [
        { type: "Annual (Privilege) Leave", quota: "14 Days", notice: "7 Days in advance", carry: "Up to 14 days", expires: "No (carried)" },
        { type: "Casual Leave", quota: "10 Days", notice: "24 Hours prior", carry: "Not allowed", expires: "Dec 31" },
        { type: "Sick Leave", quota: "12 Days", notice: "By 10:00 AM same day", carry: "Not allowed", expires: "Dec 31" }
      ],
      blocks: [
        {
          title: "Special Leave Rules & Mandatory Directives",
          points: [
            "Medical Certificate: Sick leave exceeding 2 consecutive days requires a valid medical certificate from a registered practitioner, submitted upon return.",
            "Sandwich Rule: If a Public Holiday falls adjacent to a weekend and the Employee takes connected leave, intervening days count as leave unless pre-approved 10 days in advance.",
            "No-Leave Zone: Management may freeze or decline any leave request (except medical emergencies) during critical project deployments, client crunch periods, or sudden technical emergencies.",
            "Notice Period: No leave of any kind may be taken or adjusted during the 30-day notice period.",
            "Casual and Sick leave balances expire on December 31st and cannot be encashed or carried forward.",
            "Leave Approval Authority: All leave requests must first be approved by HR Director, Maam Ramsha. A leave will only be considered valid once formally approved; otherwise, the absence will be marked as unapproved.",
            "If you have 3 paid leaves available per month, any leave taken without prior approval will be marked as absent, regardless of your remaining leave balance."
          ]
        }
      ]
    },
    {
      id: "conduct",
      title: "4. Professional Conduct & Discipline",
      description: "Workplace standards, respectful collaboration, and outsourcing regulations.",
      blocks: [
        {
          title: "Required Workplace Standards",
          points: [
            "Zero tolerance for harassment, gossip, bullying, insubordination, or toxic behavior in any form.",
            "Personal phone calls must be limited to designated breaks only. Sleeping during office hours is strictly prohibited.",
            "Employees must follow all official instructions and directives from their assigned direct manager and project heads.",
            "Company assets, internal work records, and client information must never be displayed or shared with unauthorized outsiders."
          ]
        },
        {
          title: "Work Outsourcing & Compliance",
          points: [
            "Work Outsourcing: If an employee hands over any company project to an external agency, this decision rests entirely with company management — the employee has no authority to do so independently.",
            "Any act of fraud, intentional misrepresentation, or willful breach of company policies constitutes grounds for immediate termination.",
            "Breaches must be rectified within 30 days of written notice by the Board of Directors.",
            "Employees must complete a minimum employment period of six (6) months to be eligible for an official Experience Letter."
          ]
        }
      ]
    },
    {
      id: "security",
      title: "5. Data Management, IP & Equipment Security",
      description: "Confidentiality, intellectual property rights, and asset care protocols.",
      blocks: [
        {
          title: "Data Handling & Intellectual Property",
          points: [
            "Client data, passwords, project files, credentials, and business strategies are strictly confidential and must never be shared outside the company.",
            "All files must be stored only on Company-approved storage systems and official repositories.",
            "Use strong, unique passwords for all company accounts. Do not reuse personal passwords.",
            "All intellectual property — code, designs, architectures, documents, and creative work — produced during employment belongs exclusively to HAT Tech Media."
          ]
        },
        {
          title: "Equipment & Off-boarding",
          points: [
            "Company equipment is for official work purposes only. Unauthorized personal use is not permitted.",
            "Report any hardware or system damage to HR immediately. The employee is liable for damages caused by willful negligence.",
            "Upon resignation or termination, the employee must return all company equipment, revoke client access, and delete company data from personal devices within 48 hours.",
            "Failure to comply with off-boarding obligations may result in formal legal proceedings."
          ]
        }
      ]
    },
    {
      id: "termination",
      title: "6. Termination, Notice Period & Exit Policy",
      description: "Procedures for resignation, performance exits, and contract separation.",
      blocks: [
        {
          title: "Voluntary Resignation",
          points: [
            "A written notice of a minimum Thirty (30) days is mandatory prior to resignation.",
            "The entire notice period must be served actively — performing duties, completing project handover, and transferring knowledge to successors.",
            "No leave may be taken or adjusted during the notice period. Unapproved absence will result in salary deductions."
          ]
        },
        {
          title: "Termination by the Company",
          points: [
            "The Company may terminate employment at any time for Cause, including fraud, data breach, willful misrepresentation, or gross misconduct.",
            "Immediate termination (without notice pay) is enforced for: data leaks, repeated policy violations, harassment, or duty abandonment.",
            "Where a breach is remediable, the Employee will be given Thirty (30) days written notice to cure the breach."
          ]
        }
      ]
    },
    {
      id: "internship",
      title: "7. Internship Certification & Evaluation Policy",
      description: "Duration, testing evaluation, and reporting structure for student interns.",
      blocks: [
        {
          title: "Internship Duration & Certification",
          points: [
            "Air University Interns: Duration will be 2 months, subject to successfully passing the Internship Evaluation Test.",
            "Other University Interns: Duration will be 3 months, subject to successfully passing the Internship Evaluation Test.",
            "Job Opportunity: Interns demonstrating strong performance, professional behavior, and good conduct may be considered for job interviews upon completion.",
            "Completion Certificate: Issued only to interns who successfully complete the full assigned duration. Interns leaving early (even after completing half) are not eligible for a certificate or completion letter."
          ]
        },
        {
          title: "Work Reporting & Review",
          points: [
            "Daily work and progress must be submitted daily through the portal and communicated via the assigned Team Lead.",
            "Individuals should not visit the executive office daily or directly present their daily work to the executive management without Team Lead coordination.",
            "Individual performance and work milestones will be reviewed during the weekly weekend meeting."
          ]
        }
      ]
    },
    {
      id: "signatories",
      title: "8. Executive Authorization & Board of Directors",
      description: "Official executive authorization endorsing the corporate bylaws.",
      signatories: [
        { name: "Ramsha Rashid", designation: "Director Admin & HR", organization: "HAT Tech Media" },
        { name: "Rana Awais Ahmad", designation: "CTO & Co-Founder", organization: "HAT Tech Media" },
        { name: "Wajeeha Amin", designation: "Sales & Growth Director", organization: "HAT Tech Media" }
      ],
      points: [
        "These guidelines apply to all permanent, contract, and probationary staff members as well as project interns across all departments of HAT Tech Media.",
        "Management reserves the right to periodically amend policies in accordance with corporate growth and labor statutory updates."
      ]
    }
  ]
};

export default function GovernancePolicy() {
  const [activeTab, setActiveTab] = useState("policy");
  const [isLight, setIsLight] = useState(false);
  const [loading, setLoading] = useState(true);

  // Policy States
  const [policyData, setPolicyData] = useState(DEFAULT_FULL_POLICY);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyDraft, setPolicyDraft] = useState(DEFAULT_FULL_POLICY);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Announcement States
  const [announcements, setAnnouncements] = useState([]);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementFilter, setAnnouncementFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    description: "",
    type: "general",
    priority: "medium",
    isActive: true
  });
  const [submittingAnnounce, setSubmittingAnnounce] = useState(false);

  const policyPrintRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: policyPrintRef,
    documentTitle: "HAT_Tech_Media_Company_Policy_2026",
  });

  // Watch Theme
  useEffect(() => {
    const checkTheme = () => setIsLight(document.body.classList.contains("light"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Fetch Policy & Announcements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Policy
        const policyRes = await api.get("/hr/config/company_policy");
        if (policyRes.data?.success && policyRes.data?.data?.value) {
          setPolicyData(policyRes.data.data.value);
          setPolicyDraft(policyRes.data.data.value);
        } else {
          setPolicyData(DEFAULT_FULL_POLICY);
          setPolicyDraft(DEFAULT_FULL_POLICY);
        }

        // 2. Fetch Announcements (all history)
        const annRes = await api.get("/announcements?all=true");
        if (annRes.data?.success) {
          setAnnouncements(annRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load governance data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save Policy to Backend
  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const res = await api.post("/hr/config", {
        key: "company_policy",
        value: policyDraft,
        description: "Official Company Policy and Code of Conduct"
      });
      if (res.data?.success) {
        setPolicyData(policyDraft);
        setIsEditingPolicy(false);
        toast.success("Company Policy saved & updated for all employees!");
      } else {
        toast.error("Failed to save policy");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  // Reset Policy Draft to Default
  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset the policy to the complete standard 8-section official policy?")) {
      setPolicyDraft(DEFAULT_FULL_POLICY);
    }
  };

  // Create or Update Announcement
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.description.trim()) {
      toast.error("Please fill in Title and Description");
      return;
    }

    setSubmittingAnnounce(true);
    try {
      if (editingAnnouncement) {
        // Update
        const res = await api.put(`/announcements/${editingAnnouncement._id}`, newAnnouncement);
        if (res.data?.success) {
          toast.success("Announcement updated successfully");
          setAnnouncements(prev =>
            prev.map(a => (a._id === editingAnnouncement._id ? res.data.announcement : a))
          );
          setShowCreateModal(false);
          setEditingAnnouncement(null);
        }
      } else {
        // Create
        const res = await api.post("/announcements", newAnnouncement);
        if (res.data?.success) {
          toast.success("New Announcement published!");
          setAnnouncements(prev => [res.data.announcement, ...prev]);
          setShowCreateModal(false);
          setNewAnnouncement({
            title: "",
            description: "",
            type: "general",
            priority: "medium",
            isActive: true
          });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save announcement");
    } finally {
      setSubmittingAnnounce(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data?.success) {
        toast.success("Announcement deleted");
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  // Toggle Announcement Active State
  const handleToggleActive = async (announce) => {
    try {
      const res = await api.put(`/announcements/${announce._id}`, {
        isActive: !announce.isActive
      });
      if (res.data?.success) {
        toast.success(`Announcement ${!announce.isActive ? 'activated' : 'archived'}`);
        setAnnouncements(prev =>
          prev.map(a => (a._id === announce._id ? { ...a, isActive: !a.isActive } : a))
        );
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch =
      (a.title || "").toLowerCase().includes(announcementSearch.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(announcementSearch.toLowerCase());
    const matchesFilter =
      announcementFilter === "all" ||
      (announcementFilter === "active" && a.isActive) ||
      (announcementFilter === "archived" && !a.isActive) ||
      a.type === announcementFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <Toaster position="top-right" />

      {/* TOP HERO HEADER */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isLight
            ? "bg-white border-gray-200 text-gray-900"
            : "bg-gradient-to-br from-[#11131f] via-[#0d0e17] to-[#08090f] border-white/10 text-white"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#004AAD]/15 text-[#004AAD] border border-[#004AAD]/30">
              <FiShield /> Executive Governance & Policies
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Company Policy & Announcement Center
            </h1>
            <p className={`text-xs sm:text-sm font-medium ${isLight ? "text-gray-600" : "text-gray-400"}`}>
              Official HAT Tech Media governance rules, employee policies, code of conduct, and corporate broadcasts.
            </p>
          </div>

          {/* TAB SWITCHER PILLS */}
          <div
            className={`p-1.5 rounded-2xl border flex items-center gap-1 shadow-inner ${
              isLight ? "bg-gray-100 border-gray-300" : "bg-[#181a29] border-white/10"
            }`}
          >
            <button
              onClick={() => setActiveTab("policy")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "policy"
                  ? "bg-[#004AAD] text-white shadow-lg shadow-[#004AAD]/30"
                  : isLight
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FiFileText size={15} /> Company Policy
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "announcements"
                  ? "bg-[#004AAD] text-white shadow-lg shadow-[#004AAD]/30"
                  : isLight
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FiBell size={15} /> Announcements History
              {announcements.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "announcements"
                      ? "bg-white/20 text-white"
                      : "bg-[#004AAD]/20 text-[#004AAD]"
                  }`}
                >
                  {announcements.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPANY POLICY */}
      {/* ========================================================================= */}
      {activeTab === "policy" && (
        <div className="space-y-6">
          {/* Action Header Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isLight ? "bg-white border-gray-200" : "bg-[#11131f] border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isEditingPolicy ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}
              >
                Status: {isEditingPolicy ? "Editing Mode Active" : "Published Live (Sync Active)"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!isEditingPolicy ? (
                <>
                  <button
                    onClick={() => {
                      setPolicyDraft(JSON.parse(JSON.stringify(policyData)));
                      setIsEditingPolicy(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    <FiEdit3 size={14} /> Edit Policy
                  </button>
                  <button
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#004AAD] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    <FiPrinter size={14} /> Print / Save PDF
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <FiRefreshCw size={14} /> Reset Default
                  </button>
                  <button
                    onClick={() => setIsEditingPolicy(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs uppercase tracking-wider border border-red-500/30 transition-all cursor-pointer"
                  >
                    <FiX size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSavePolicy}
                    disabled={savingPolicy}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FiSave size={14} /> {savingPolicy ? "Saving..." : "Save & Publish"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* EDIT MODE FORM */}
          {isEditingPolicy ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
                isLight ? "bg-white border-gray-200 text-gray-900" : "bg-[#11131f] border-white/10 text-white"
              }`}
            >
              <div className="border-b pb-4 border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-black uppercase text-[#004AAD] flex items-center gap-2">
                  <FiEdit3 /> Edit Policy Sections & Clauses
                </h3>
                <p className={`text-xs ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  Make modifications below. Any saved updates will instantly sync with the employee portal.
                </p>
              </div>

              {/* Main Document Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Document Title</label>
                  <input
                    type="text"
                    value={policyDraft.title}
                    onChange={(e) => setPolicyDraft({ ...policyDraft, title: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-[#004AAD] ${
                      isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Office Working Hours</label>
                  <input
                    type="text"
                    value={policyDraft.officeHours}
                    onChange={(e) => setPolicyDraft({ ...policyDraft, officeHours: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-[#004AAD] ${
                      isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              {/* Section Blocks */}
              <div className="space-y-6 pt-4">
                {policyDraft.sections.map((section, sIdx) => (
                  <div
                    key={section.id || sIdx}
                    className={`p-5 rounded-2xl border ${
                      isLight ? "bg-gray-50 border-gray-200" : "bg-[#161826] border-white/10"
                    } space-y-4`}
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = [...policyDraft.sections];
                          updated[sIdx].title = e.target.value;
                          setPolicyDraft({ ...policyDraft, sections: updated });
                        }}
                        className={`text-base font-black p-2 rounded-lg border flex-1 max-w-md ${
                          isLight ? "bg-white border-gray-300 text-gray-900" : "bg-[#10121d] border-white/20 text-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                        Section Description
                      </label>
                      <input
                        type="text"
                        value={section.description}
                        onChange={(e) => {
                          const updated = [...policyDraft.sections];
                          updated[sIdx].description = e.target.value;
                          setPolicyDraft({ ...policyDraft, sections: updated });
                        }}
                        className={`w-full p-2.5 rounded-lg border text-xs ${
                          isLight ? "bg-white border-gray-300 text-gray-900" : "bg-[#10121d] border-white/20 text-white"
                        }`}
                      />
                    </div>

                    {/* Sub-blocks if present */}
                    {section.blocks && section.blocks.map((b, bIdx) => (
                      <div key={bIdx} className="p-4 rounded-xl border bg-black/10 border-white/5 space-y-3">
                        <input
                          type="text"
                          value={b.title}
                          onChange={(e) => {
                            const updated = [...policyDraft.sections];
                            updated[sIdx].blocks[bIdx].title = e.target.value;
                            setPolicyDraft({ ...policyDraft, sections: updated });
                          }}
                          className={`text-xs font-black p-1.5 rounded border ${
                            isLight ? "bg-white border-gray-300 text-[#004AAD]" : "bg-[#181a29] border-white/20 text-blue-400"
                          }`}
                        />
                        <div className="space-y-2">
                          {b.points.map((pt, ptIdx) => (
                            <div key={ptIdx} className="flex items-center gap-2">
                              <span className="text-[#004AAD] font-bold">•</span>
                              <input
                                type="text"
                                value={pt}
                                onChange={(e) => {
                                  const updated = [...policyDraft.sections];
                                  updated[sIdx].blocks[bIdx].points[ptIdx] = e.target.value;
                                  setPolicyDraft({ ...policyDraft, sections: updated });
                                }}
                                className={`flex-1 p-2 rounded-lg border text-xs ${
                                  isLight ? "bg-white border-gray-300 text-gray-900" : "bg-[#10121d] border-white/20 text-white"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...policyDraft.sections];
                                  updated[sIdx].blocks[bIdx].points.splice(ptIdx, 1);
                                  setPolicyDraft({ ...policyDraft, sections: updated });
                                }}
                                className="p-2 text-red-400 hover:text-red-500 cursor-pointer"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...policyDraft.sections];
                              updated[sIdx].blocks[bIdx].points.push("New policy clause point.");
                              setPolicyDraft({ ...policyDraft, sections: updated });
                            }}
                            className="mt-1 text-xs font-bold text-[#004AAD] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus size={13} /> Add Point
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Direct Points if present */}
                    {section.points && !section.blocks && (
                      <div className="space-y-2">
                        {section.points.map((pt, ptIdx) => (
                          <div key={ptIdx} className="flex items-center gap-2">
                            <span className="text-[#004AAD] font-bold">•</span>
                            <input
                              type="text"
                              value={pt}
                              onChange={(e) => {
                                const updated = [...policyDraft.sections];
                                updated[sIdx].points[ptIdx] = e.target.value;
                                setPolicyDraft({ ...policyDraft, sections: updated });
                              }}
                              className={`flex-1 p-2 rounded-lg border text-xs ${
                                isLight ? "bg-white border-gray-300 text-gray-900" : "bg-[#10121d] border-white/20 text-white"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...policyDraft.sections];
                                updated[sIdx].points.splice(ptIdx, 1);
                                setPolicyDraft({ ...policyDraft, sections: updated });
                              }}
                              className="p-2 text-red-400 hover:text-red-500 cursor-pointer"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW MODE (OFFICIAL 8-SECTION DOCUMENT) */
            <div
              ref={policyPrintRef}
              className={`p-6 sm:p-10 rounded-3xl border shadow-2xl space-y-8 print:p-8 print:bg-white print:text-black print:border-none print:shadow-none ${
                isLight ? "bg-white border-gray-200 text-gray-900" : "bg-[#11131f] border-white/10 text-white"
              }`}
            >
              {/* Header Title */}
              <div className={`text-center border-b pb-6 ${isLight ? "border-gray-200" : "border-white/10"}`}>
                <div className="inline-block px-3 py-1 rounded-full bg-[#004AAD]/10 text-[#004AAD] text-xs font-black uppercase tracking-widest mb-2 border border-[#004AAD]/20">
                  Official Governance Document
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{policyData.title}</h2>
                <p className={`text-xs mt-1 font-semibold ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  {policyData.subtitle}
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-8">
                {policyData.sections.map((sec, idx) => (
                  <section key={sec.id || idx} className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-[#004AAD] pl-3">
                      <FiShield className="text-[#004AAD]" size={18} />
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">
                        {sec.title}
                      </h3>
                    </div>

                    {sec.description && (
                      <p className={`text-xs leading-relaxed ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                        {sec.description}
                      </p>
                    )}

                    {/* Rules Table (Section 2) */}
                    {sec.rulesTable && (
                      <div
                        className={`overflow-x-auto rounded-xl border ${
                          isLight ? "border-gray-200" : "border-white/10"
                        }`}
                      >
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={isLight ? "bg-gray-100 border-b border-gray-200" : "bg-white/5 border-b border-white/10"}>
                              <th className="p-3 font-black uppercase text-blue-500">Scenario</th>
                              <th className="p-3 font-black uppercase">Rule</th>
                              <th className="p-3 font-black uppercase text-amber-500">Consequence</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isLight ? "divide-gray-200 text-gray-700" : "divide-white/10 text-gray-300"}`}>
                            {sec.rulesTable.map((row, rIdx) => (
                              <tr key={rIdx} className={isLight ? "hover:bg-gray-50" : "hover:bg-white/5"}>
                                <td className="p-3 font-bold">{row.scenario}</td>
                                <td className="p-3">{row.rule}</td>
                                <td className="p-3 font-semibold text-amber-400">{row.consequence}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Leaves Table (Section 3) */}
                    {sec.leavesTable && (
                      <div
                        className={`overflow-x-auto rounded-xl border ${
                          isLight ? "border-gray-200" : "border-white/10"
                        }`}
                      >
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={isLight ? "bg-gray-100 border-b border-gray-200" : "bg-white/5 border-b border-white/10"}>
                              <th className="p-3 font-black uppercase text-purple-500">Leave Type</th>
                              <th className="p-3 font-black uppercase">Quota / Year</th>
                              <th className="p-3 font-black uppercase text-blue-500">Notice Required</th>
                              <th className="p-3 font-black uppercase text-emerald-500">Carry Forward</th>
                              <th className="p-3 font-black uppercase text-amber-500">Expires</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isLight ? "divide-gray-200 text-gray-700" : "divide-white/10 text-gray-300"}`}>
                            {sec.leavesTable.map((lRow, lIdx) => (
                              <tr key={lIdx} className={isLight ? "hover:bg-gray-50" : "hover:bg-white/5"}>
                                <td className="p-3 font-bold">{lRow.type}</td>
                                <td className="p-3 font-semibold">{lRow.quota}</td>
                                <td className="p-3">{lRow.notice}</td>
                                <td className="p-3 text-emerald-400">{lRow.carry}</td>
                                <td className="p-3">{lRow.expires}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Sub-blocks (Grid View) */}
                    {sec.blocks && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sec.blocks.map((blk, bIdx) => (
                          <div
                            key={bIdx}
                            className={`p-4 rounded-xl border space-y-2 ${
                              isLight ? "bg-gray-50 border-gray-200" : "bg-[#161826] border-white/10"
                            }`}
                          >
                            <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">
                              {blk.title}
                            </h4>
                            <ul className="space-y-1.5 text-xs leading-relaxed">
                              {blk.points.map((pt, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2">
                                  <span className="text-[#004AAD] font-bold">•</span>
                                  <span className={isLight ? "text-gray-700" : "text-gray-300"}>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Signatories (Section 8) */}
                    {sec.signatories && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center pt-2">
                        {sec.signatories.map((sig, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-4 rounded-2xl border space-y-3 ${
                              isLight ? "bg-gray-50 border-gray-200" : "bg-[#161826] border-white/10"
                            }`}
                          >
                            <div className="h-12 flex items-center justify-center font-serif text-lg italic text-[#004AAD] border-b border-dashed border-gray-300 dark:border-white/10 pb-1">
                              {sig.name}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{sig.name}</p>
                              <p className="text-[10px] uppercase font-bold text-blue-400">{sig.designation}</p>
                              <p className="text-[9px] text-gray-400">{sig.organization}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Standalone points */}
                    {sec.points && (
                      <ul className="space-y-1.5 pt-1 text-xs">
                        {sec.points.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="text-[#004AAD] font-bold">•</span>
                            <span className={isLight ? "text-gray-700" : "text-gray-300"}>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              {/* Document Footer */}
              <div
                className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2 ${
                  isLight ? "border-gray-200 text-gray-500" : "border-white/10 text-gray-400"
                }`}
              >
                <span>Authorized by: <strong>Executive Administration & HR</strong></span>
                <span>Document Status: <strong>Live & Enforced</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANNOUNCEMENTS HISTORY */}
      {/* ========================================================================= */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              isLight ? "bg-white border-gray-200" : "bg-[#11131f] border-white/10"
            }`}
          >
            {/* Search */}
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search announcements by title or content..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#004AAD] ${
                  isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                }`}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
              <select
                value={announcementFilter}
                onChange={(e) => setAnnouncementFilter(e.target.value)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-[#004AAD] cursor-pointer ${
                  isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                }`}
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
                <option value="active">Active Only</option>
                <option value="archived">Archived Only</option>
              </select>

              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setNewAnnouncement({
                    title: "",
                    description: "",
                    type: "general",
                    priority: "medium",
                    isActive: true
                  });
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004AAD] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#004AAD]/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <FiPlus size={15} /> + New Announcement
              </button>
            </div>
          </div>

          {/* Announcements Timeline / Card List */}
          {filteredAnnouncements.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isLight ? "bg-white border-gray-200" : "bg-[#11131f] border-white/10"
              }`}
            >
              <FiBell className="mx-auto text-4xl text-gray-400 mb-3 opacity-50" />
              <h3 className={`text-base font-bold ${isLight ? "text-gray-800" : "text-white"}`}>
                No announcements found
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {announcementSearch || announcementFilter !== "all"
                  ? "Try adjusting your search or category filter."
                  : "Post your first company announcement using the button above."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAnnouncements.map((ann) => {
                const dateStr = ann.createdAt || ann.date
                  ? new Date(ann.createdAt || ann.date).toLocaleDateString("en-PK", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Recent";

                const isUrgent = ann.type === "urgent" || ann.priority === "high";
                const isHoliday = ann.type === "holiday";
                const isEvent = ann.type === "event";

                return (
                  <div
                    key={ann._id}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative group ${
                      isLight
                        ? "bg-white border-gray-200 shadow-sm hover:shadow-md text-gray-900"
                        : "bg-[#11131f] border-white/10 hover:border-white/20 text-white"
                    } ${!ann.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type Tag */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                            isUrgent
                              ? "bg-red-500/15 border-red-500/30 text-red-500"
                              : isHoliday
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                              : isEvent
                              ? "bg-purple-500/15 border-purple-500/30 text-purple-500"
                              : "bg-blue-500/15 border-blue-500/30 text-blue-500"
                          }`}
                        >
                          {ann.type || "General"}
                        </span>

                        {/* Priority Tag */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ann.priority === "high"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : ann.priority === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          Priority: {ann.priority || "Medium"}
                        </span>

                        {/* Status Tag */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ann.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {ann.isActive ? "● Active" : "Archived"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <FiClock size={12} />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <h4 className="text-base sm:text-lg font-black tracking-tight mb-2">
                      {ann.title}
                    </h4>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isLight ? "text-gray-700" : "text-gray-300"
                      }`}
                    >
                      {ann.description}
                    </p>

                    <div
                      className={`mt-4 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                        isLight ? "border-gray-200" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-gray-400 font-semibold">
                        <span>Posted by:</span>
                        <span className="text-[#004AAD] font-bold">
                          {ann.authorName || "Administration"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleActive(ann)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            ann.isActive
                              ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          {ann.isActive ? "Archive" : "Activate"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingAnnouncement(ann);
                            setNewAnnouncement({
                              title: ann.title,
                              description: ann.description,
                              type: ann.type || "general",
                              priority: ann.priority || "medium",
                              isActive: ann.isActive !== undefined ? ann.isActive : true
                            });
                            setShowCreateModal(true);
                          }}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FiEdit3 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann._id)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-5 animate-scaleIn ${
              isLight ? "bg-white border-gray-300 text-gray-900" : "bg-[#11131f] border-white/20 text-white"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-black uppercase text-[#004AAD] flex items-center gap-2">
                <FiBell /> {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAnnouncement(null);
                }}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Office Closed for Eid Holidays / Important Update"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  required
                  className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#004AAD] ${
                    isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Category</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-[#004AAD] ${
                      isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                    }`}
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="event">Event</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-[#004AAD] ${
                      isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Description / Content *</label>
                <textarea
                  rows={5}
                  placeholder="Type the full announcement message here..."
                  value={newAnnouncement.description}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                  required
                  className={`w-full p-3 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#004AAD] ${
                    isLight ? "bg-gray-50 border-gray-300 text-gray-900" : "bg-[#181a29] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnounce}
                  className="px-6 py-2.5 rounded-xl bg-[#004AAD] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#004AAD]/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingAnnounce
                    ? "Publishing..."
                    : editingAnnouncement
                    ? "Update Announcement"
                    : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
