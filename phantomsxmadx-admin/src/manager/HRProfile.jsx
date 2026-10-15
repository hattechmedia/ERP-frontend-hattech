import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Camera, Save, User, Mail, FileText, Phone, MapPin, Shield, Building, Star, CreditCard } from "lucide-react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import CropImageModal from "../components/CropImageModal";

export default function HRProfile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    department: "",
    jobTitle: "",
    experience: "",
    linkedIn: "",
    skills: "",
    role: "",
    image: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      iban: ""
    }
  });

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/profile/hr');
        if (res.data.success) {
          setProfile({
            ...res.data.profile,
            bankDetails: res.data.profile.bankDetails || {
              bankName: "",
              accountNumber: "",
              accountHolder: "",
              iban: ""
            }
          });
          // Update session storage for immediate topbar sync if needed
          const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
          if (currentUser && res.data.profile.image) {
            sessionStorage.setItem("currentUser", JSON.stringify({ ...currentUser, image: res.data.profile.image, name: res.data.profile.name }));
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (error) {
        console.error("Failed to fetch HR profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const res = await api.put('/profile/hr', profile);
      if (res.data.success) {
        setProfile(res.data.profile);
        // Sync with currentUser for Topbar update
        const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
        if (currentUser) {
          const updatedUser = { ...currentUser, image: res.data.profile.image, name: res.data.profile.name };
          sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("storage"));
        }
        toast.success("HR Profile updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile.");
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

  const handleImageUpload = (e) => {
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
    setProfile((prev) => ({ ...prev, image: croppedImage }));
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };



  const getInitials = (name) => {
    if (!name) return "HR";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 pt-14 md:pt-0 max-w-4xl mx-auto">
      {/* Light theme improvements handled via theme-aware classes */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#004AAE]">
          HR Manager Profile
        </h1>
        <p className="text-theme-secondary mt-2 text-lg">Manage your personal and professional details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-3xl space-y-8 backdrop-blur-sm bg-theme-card border border-blue-500/20 shadow-lg">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-sky-300 flex items-center justify-center shadow-lg">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      className="w-full h-full object-cover"
                      alt="HR Profile"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-blue-700">
                      {getInitials(profile.name)}
                    </span>
                  )}
                </div>
                <button
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-sky-600 text-white p-3 rounded-full hover:from-blue-700 hover:to-sky-700 transition-all duration-300 shadow-lg hover:scale-110"
                >
                  <Camera color="white" stroke="white" strokeWidth={2.5} size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-xl font-bold text-theme-primary">
                  {profile.name || "HR Manager Name"}
                </h2>
                <p className="text-sm text-blue-500 dark:text-blue-300 mt-2">
                  {profile.email || "Email"}
                </p>
                <p className="text-sm text-sky-500 dark:text-sky-300 mt-1">
                  {profile.department || "Human Resources"}
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="pt-6 border-t border-blue-400/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs text-theme-secondary uppercase tracking-wider">Role</p>
                  <p className="font-semibold text-theme-primary">{profile.role || "HR Manager"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Building size={18} />
                </div>
                <div>
                  <p className="text-xs text-theme-secondary uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-theme-primary">{profile.department || "Human Resources"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Form */}
          <div className="p-8 rounded-3xl space-y-6 backdrop-blur-sm bg-theme-card border border-blue-500/20 shadow-lg">
            <h3 className="text-xl font-bold text-theme-primary">Profile Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-400" />
                  Full Name
                </label>
                <input
                  type="text"

                  onChange={handleInputChange('name')}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Mail size={16} className="text-blue-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={handleInputChange('email')}
                  placeholder="your@email.com"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Phone size={16} className="text-blue-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  Location
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={handleInputChange('location')}
                  placeholder="City, Country"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Building size={16} className="text-blue-400" />
                  Department
                </label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={handleInputChange('department')}
                  placeholder="Your department"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-blue-400" />
                  Job Title
                </label>
                <input
                  type="text"
                  value={profile.jobTitle}
                  onChange={handleInputChange('jobTitle')}
                  placeholder="Your Job Title"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Building size={16} className="text-blue-400" />
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={profile.experience}
                  onChange={handleInputChange('experience')}
                  placeholder="Years of Experience"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* LinkedIn */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <span className="text-blue-400 text-lg font-bold">in</span>
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={profile.linkedIn}
                  onChange={handleInputChange('linkedIn')}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              {/* Skills */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Star size={16} className="text-blue-400" />
                  Skills (comma separated)
                </label>
                <textarea
                  value={profile.skills}
                  onChange={handleInputChange('skills')}
                  placeholder="React, HR Management, Communication..."
                  rows="2"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted resize-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-400" />
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={handleInputChange('bio')}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-6">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className={`w-full h-14 rounded-xl text-white font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004AAE] hover:bg-[#003882]'}`}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={22} />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* BANK DETAILS CARD */}
          <div className="p-8 rounded-3xl space-y-6 backdrop-blur-sm bg-theme-card border border-blue-500/20 shadow-lg mt-6">
            <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
              <CreditCard size={20} className="text-green-500" />
              Bank Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">Bank Name</label>
                <input
                  type="text"
                  value={profile.bankDetails?.bankName || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, bankName: e.target.value } })}
                  placeholder="e.g. HBL"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">Account Holder Name</label>
                <input
                  type="text"
                  value={profile.bankDetails?.accountHolder || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountHolder: e.target.value } })}
                  placeholder="Official Name"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">Account Number</label>
                <input
                  type="text"
                  value={profile.bankDetails?.accountNumber || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountNumber: e.target.value } })}
                  placeholder="00000000000"
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">IBAN</label>
                <input
                  type="text"
                  value={profile.bankDetails?.iban || ""}
                  onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, iban: e.target.value } })}
                  placeholder="PK00XXXX..."
                  className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary placeholder-theme-muted"
                />
              </div>
            </div>
          </div>

          {/* SECURITY CARD */}
          <div className="p-8 rounded-3xl space-y-6 backdrop-blur-sm bg-theme-card border border-blue-500/20 shadow-lg mt-6">
            <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
              <Shield size={20} className="text-red-500" />
              Security
            </h3>

            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-theme-primary flex items-center gap-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary focus:ring-1 focus:ring-red-500 pr-12"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showCurrentPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-theme-primary flex items-center gap-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary focus:ring-1 focus:ring-red-500 pr-12"
                    placeholder="Min. 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showNewPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-theme-primary flex items-center gap-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none transition-all text-theme-primary focus:ring-1 focus:ring-red-500 pr-12"
                    placeholder="Re-type new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showConfirmPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className={`px-6 py-4 rounded-xl text-white font-bold transition-all shadow-lg w-full ${savingPassword ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#004AAE] hover:bg-[#003882]'}`}
                >
                  {savingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
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
