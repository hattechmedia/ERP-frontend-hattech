import { useState, useEffect } from "react";
import { FiUser, FiBriefcase, FiCamera, FiSave, FiLinkedin, FiMapPin, FiPhone, FiMail, FiCreditCard } from "react-icons/fi";
import { IoEye, IoEyeOff } from "react-icons/io5";
import api from "../services/api";
import toast from "react-hot-toast";
import CropImageModal from "../components/CropImageModal";

export default function ProjectHeadProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    image: "",
    jobTitle: "Project Head",
    department: "Projects & Development",
    location: "",
    linkedIn: "",
    experience: "",
    skills: "",
    phone: "",
    email: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      iban: ""
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/manager');
      if (res.data.success && res.data.profile) {
        const p = res.data.profile;
        // Logic to properly extract name without "User" fallback if possible
        let fullName = p.name || "";
        if (p.personalInfo?.firstName) {
          fullName = `${p.personalInfo.firstName} ${p.personalInfo.lastName || ""}`.trim();
        }
        // Aggressively strip 'User' suffix (case insensitive, with or without leading space)
        fullName = fullName.replace(/\s*User$/i, '').trim();

        setProfile({
          ...profile,
          name: fullName,
          email: p.email || "",
          bio: p.bio || "",
          phone: p.phone || "",
          location: p.location || "",
          department: p.department || "Projects & Development",
          jobTitle: p.jobTitle || "Project Head",
          image: p.image || "",
          experience: p.experience || "",
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ""),
          linkedIn: p.socialLinks?.linkedin || "",
          bankDetails: p.bankDetails || {
            bankName: "",
            accountNumber: "",
            accountHolder: "",
            iban: ""
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      // Construct payload compatible with profileController.updateManagerProfile
      const payload = {
        name: profile.name,
        bio: profile.bio,
        image: profile.image,
        phone: profile.phone,
        location: profile.location,
        department: profile.department,
        experience: profile.experience,
        skills: profile.skills,
        linkedIn: profile.linkedIn,
        bankDetails: profile.bankDetails
      };

      await api.put('/profile/manager', payload);

      // Sync with currentUser for Topbar update
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
      if (currentUser) {
        const updatedUser = { ...currentUser, image: profile.image, name: profile.name };
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("profileUpdate")); // Force Topbar update in same tab
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      setSavingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        toast.success("Password updated successfully! Please login with your new password on next session.");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.data.message || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An error occurred while updating the password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageToCrop(event.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage) => {
    setProfile({ ...profile, image: croppedImage });
    setShowCropModal(false);
    setImageToCrop(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004AAE]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-14 md:pt-0 max-w-7xl mx-auto pb-10">
      {/* HEADER */}
      <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-bold text-[#004AAE]">
          My Profile
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-lg">Manage your professional identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - PROFILE CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center gap-6 shadow-xl relative overflow-hidden group transition-all hover:shadow-2xl hover:shadow-[#004AAE]/10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#004AAE]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 text-center w-full flex flex-col items-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#004AAE] shadow-xl bg-white flex items-center justify-center">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#004AAE]">{profile.name?.charAt(0) || "P"}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#004AAE] p-2.5 rounded-full cursor-pointer hover:bg-[#003882] transition-transform hover:scale-110 shadow-lg border-2 border-white z-20">
                  <FiCamera color="white" stroke="white" strokeWidth="2.5" className="text-white text-lg" style={{ color: '#ffffff' }} />
                  <input type="file" onChange={handleImage} className="hidden" accept="image/*" />
                </label>
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{profile.name || "Project Head"}</h2>
                <p className="text-[#004AAE] font-medium mt-1">{profile.jobTitle}</p>
                <p className="text-sm text-gray-500 mt-2 capitalize">{profile.department}</p>
              </div>
            </div>

            <div className="w-full pt-6 border-t border-[var(--border-color)] z-10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="block text-xl font-bold text-[var(--text-primary)]">{profile.experience || "0"}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Years Exp</span>
                </div>
                <div>
                  <span className="block text-xl font-bold text-green-500">Active</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                </div>
              </div>
            </div>
          </div>

          {/* DESKTOP SAVE BUTTON */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`hidden lg:flex w-full items-center justify-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 shadow-lg ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004AAE] hover:bg-[#003882] hover:shadow-[#004AAE]/25 hover:-translate-y-1'}`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="text-xl" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN - DETAILS FORM */}
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL INFO CARD */}
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="p-3 rounded-xl bg-[#004AAE]/10 text-[#004AAE]">
                <FiUser className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Personal Details</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Full Name</label>
              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="e.g. John Doe"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email Address</label>
              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] opacity-70 cursor-not-allowed"
                  placeholder="john@example.com"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Phone Number</label>
              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Location</label>
              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="City, Country"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Bio</label>
              <textarea
                className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none resize-none"
                placeholder="Tell us a bit about yourself..."
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 mt-8 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="p-3 rounded-xl bg-[#004AAE]/10 text-[#004AAE]">
                <FiBriefcase className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Professional Info</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Job Title</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="Software Engineer"
                  value={profile.jobTitle}
                  onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Department</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="Engineering"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Experience (Years)</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="0"
                  type="number"
                  min="0"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">LinkedIn Profile</label>
                <div className="relative">
                  <input
                    className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                    placeholder="https://linkedin.com/in/username"
                    value={profile.linkedIn}
                    onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Skills</label>
                <textarea
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none resize-none"
                  placeholder="React, Node.js, Design..."
                  rows={2}
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* BANK DETAILS CARD */}
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                <FiCreditCard className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Bank Name</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="e.g. HBL"
                  value={profile.bankDetails?.bankName || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, bankName: e.target.value } })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Account Holder Name</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="Official Name"
                  value={profile.bankDetails?.accountHolder || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountHolder: e.target.value } })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Account Number</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="00000000000"
                  value={profile.bankDetails?.accountNumber || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountNumber: e.target.value } })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">IBAN</label>
                <input
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[#004AAE] focus:ring-1 focus:ring-[#004AAE] transition-all outline-none"
                  placeholder="PK00 XXXX..."
                  value={profile.bankDetails?.iban || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, iban: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* SECURITY CARD */}
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden mt-6">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Security</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    className="w-full p-3 pr-10 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAE] transition-colors"
                  >
                    {showCurrentPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="w-full p-3 pr-10 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none"
                    placeholder="Min. 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAE] transition-colors"
                  >
                    {showNewPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full p-3 pr-10 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none"
                    placeholder="Re-type new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004AAE] transition-colors"
                  >
                    {showConfirmPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className={`px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${savingPassword ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004AAE] hover:bg-[#003882] hover:-translate-y-1'}`}
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* MOBILE SAVE BUTTON */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`flex lg:hidden w-full items-center justify-center gap-3 px-8 py-4 mt-6 rounded-xl text-white font-bold text-lg transition-all duration-300 shadow-lg ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004AAE] hover:bg-[#003882] hover:shadow-[#004AAE]/25'}`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="text-xl" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {showCropModal && (
        <CropImageModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
}
