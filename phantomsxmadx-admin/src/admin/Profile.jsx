import { useState, useEffect, useRef } from "react";
import { Camera, Save, User, Mail, FileText, Phone, MapPin, Shield, Building, Lock } from "lucide-react";
import { FiVideo } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function AdminProfile() {
  const { confirm } = useModal();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    designation: "",
    role: "",
    image: "",
    password: "", // Added password field
  });
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        const role = (user.role || "").toLowerCase();
        const endpoint = role === 'admin' ? '/profile/admin' : `/profile/${role.replace('_', '-')}`;
        const res = await api.get(endpoint);
        if (res.data.success) {
          setProfile(prev => ({
            ...prev,
            ...res.data.profile,
            password: "" // Don't populate password
          }));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'GOOGLE_CONNECTED') {
        fetchProfile();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const role = (user.role || "").toLowerCase();
      const endpoint = role === 'admin' ? '/profile/admin' : `/profile/${role.replace('_', '-')}`;
      const res = await api.put(endpoint, profile);
      if (res.data.success) {
        toast.success("Executive profile updated successfully!");
        // Update local storage for immediate UI updates elsewhere
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const updatedUser = {
          ...currentUser,
          name: res.data.profile.name,
          email: res.data.profile.email,
          avatar: res.data.profile.image,
          role: res.data.profile.role
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        // Clear password field after save
        setProfile(prev => ({ ...prev, password: "" }));
      }
    } catch (error) {
      console.error("Failed to save profile", error);
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
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
      // Compress the image before setting to state to avoid Payload Too Large errors
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setProfile(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const resetProfile = async () => {
    const isConfirmed = await confirm({
      title: 'Reset Profile',
      message: 'Are you sure you want to reset all fields? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Reset Now',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      setProfile({
        name: "",
        email: "",
        bio: "",
        phone: "",
        location: "",
        designation: "",
        role: "",
        image: "",
        password: "",
      });
    }
  };

  const connectGoogle = () => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser") || "{}");
    const uid = currentUser._id || currentUser.id || currentUser.userId;
    const clientId = "691160602273-rsdmq79hcuq8adntb2g9oenhsgeju1ph.apps.googleusercontent.com";
    const redirectUri = "https://www.hattech.online/google/callback";
    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent(scopes)}&prompt=consent&include_granted_scopes=true&state=${uid}&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.open(googleAuthUrl, '_blank', 'width=550,height=650');
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 pt-14 md:pt-0 max-w-6xl mx-auto">
      {/* Light theme improvements */}
      <style>{`
        .light .profile-card {
          background: linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%);
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 4px 24px 0 rgba(37,99,235,0.08);
        }
        .light .profile-form {
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 4px 24px 0 rgba(37,99,235,0.06);
        }
      `}</style>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#004AAD]">
          {profile.role?.toLowerCase() === 'it_support' ? 'IT Support Profile' : 'Executive Profile'}
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Manage {profile.role?.toLowerCase() === 'it_support' ? 'support' : 'executive'} account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-3xl profile-card space-y-8 backdrop-blur-sm">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#004AAD] flex items-center justify-center shadow-lg bg-gradient-to-br from-[#004AAD]/20 to-[#004AAD]/5 backdrop-blur-sm">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      className="w-full h-full object-cover"
                      alt="Admin Profile"
                    />
                  ) : (
                    <span className="text-4xl font-extrabold text-[#004AAD] drop-shadow-[0_2px_4px_rgba(0,74,173,0.2)] tracking-tighter">
                      {getInitials(profile.name)}
                    </span>
                  )}
                </div>
                <button
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 bg-[#004AAD] text-white p-3 rounded-full hover:bg-[#003882] transition-all duration-300 shadow-xl hover:scale-110 ring-4 ring-[#e0e7ff] dark:ring-[#1e1e2d]"
                >
                  <Camera size={20} />
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
                <h2 className="text-xl font-bold text-white">
                  {profile.name || "Admin Name"}
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  {profile.email || "Email"}
                </p>
                <p className="text-sm font-bold text-[#004AAD] mt-1 bg-[#004AAD]/10 px-4 py-1.5 rounded-full inline-block">
                  {profile.designation || "Designation"}
                </p>
              </div>
            </div>

            {/* Admin Stats */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[#004AAD]/10 rounded-xl border border-[#004AAD]/30">
                <div className="p-3 bg-[#004AAD] rounded-xl">
                  <Shield size={24} className="!text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-300">Access Level</div>
                  <div className="font-bold text-white">
                    {profile.role?.toLowerCase() === 'it_support' ? 'IT Support Authority' : 'Executive Authority'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:col-span-3">
          <div className="p-8 rounded-3xl profile-form space-y-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <User size={18} className="text-[#004AAD]" />
                  Administrator Name
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="Enter admin full name"
                  value={profile.name}
                  onChange={handleInputChange('name')}
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <Mail size={18} className="text-[#004AAD]" />
                  Admin Email
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="admin@company.com"
                  type="email"
                  value={profile.email}
                  onChange={handleInputChange('email')}
                />
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <Lock size={18} className="text-[#004AAD]" />
                  Admin Password
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="********"
                  type="password"
                  value={profile.password}
                  onChange={handleInputChange('password')}
                />
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <Phone size={18} className="text-[#004AAD]" />
                  Contact Number
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="+1 (555) 000-0000"
                  value={profile.phone}
                  onChange={handleInputChange('phone')}
                />
              </div>

              {/* Designation */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <Building size={18} className="text-[#004AAD]" />
                  Designation
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="e.g., CEO, Manager, Operations"
                  value={profile.designation}
                  onChange={handleInputChange('designation')}
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                  <MapPin size={18} className="text-[#004AAD]" />
                  Office Location
                </label>
                <input
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg"
                  placeholder="Headquarters, Branch Office"
                  value={profile.location}
                  onChange={handleInputChange('location')}
                />
              </div>


            </div>

            {/* Bio */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                <FileText size={18} className="text-[#004AAD]" />
                Admin Notes / Bio
              </label>
              <textarea
                rows={5}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAD]/30 focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg resize-none"
                placeholder="Administrator responsibilities, special notes, or bio..."
                value={profile.bio}
                onChange={handleInputChange('bio')}
              />
              <p className="text-xs text-gray-400">Administrative notes for reference</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={saveProfile}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#004AAD] hover:bg-[#003882] !text-white font-bold text-lg transition-all duration-500 shadow-2xl hover:shadow-[#004AAD]/50 transform hover:scale-105"
              >
                <Save size={20} />
                Save Profile
              </button>
              <button
                onClick={resetProfile}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 !text-white hover:!text-black font-semibold transition-all duration-300 shadow-lg hover:scale-105"
              >
                Reset All
              </button>

              <div className="w-full h-px bg-[#004AAD]/20 my-2"></div>

              <button
                onClick={connectGoogle}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-500 shadow-xl ${
                  profile.googleConnected 
                    ? "border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white" 
                    : "border-[#004AAD] text-[#004AAD] hover:bg-[#004AAD] hover:text-white"
                }`}
              >
                <FiVideo size={20} />
                {profile.googleConnected ? "Connected with Google" : "Connect Google Calendar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}