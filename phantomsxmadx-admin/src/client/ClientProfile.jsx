import { useState, useEffect, useRef } from "react";
import { useModal } from "../contexts/ModalContext";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { Camera, User, Building, Mail, Phone, MapPin, Globe, FileText, Save } from "lucide-react";

export default function ClientProfile() {
    const { confirm } = useModal();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        bio: "",
        phone: "",
        location: "",
        website: "",
        companyName: "",
        image: "",
        password: "", // Optional password update
    });
    const [loading, setLoading] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profile/client');
                if (res.data.success) {
                    setProfile(prev => ({
                        ...prev,
                        ...res.data.profile,
                        companyName: res.data.profile.companyName || "",
                        password: "" // Don't populate password
                    }));
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        };
        fetchProfile();
    }, []);

    const saveProfile = async () => {
        setLoading(true);
        try {
            const res = await api.put('/profile/client', profile);
            if (res.data.success) {
                toast.success("Client profile saved successfully!");
                // Update local storage for immediate UI updates elsewhere
                const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
                // Ensure we only update keys that exist on currentUser or are relevant
                const updatedUser = {
                    ...currentUser,
                    name: res.data.profile.name,
                    email: res.data.profile.email,
                    avatar: res.data.profile.image,
                    // role: res.data.profile.role // Role usually shouldn't change here
                };
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));

                // Clear password field after save
                setProfile(prev => ({ ...prev, password: "" }));
                setShowAvatarSelector(false);
            }
        } catch (error) {
            console.error("Failed to save profile", error);
            toast.error("Failed to save profile: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field) => (e) => {
        setProfile(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAvatarSelect = (imgUrl) => {
        setProfile(prev => ({ ...prev, image: imgUrl }));
        setShowAvatarSelector(false);
    };

    const resetProfile = async () => {
        if (await confirm({
            title: "Reset Changes",
            message: "Are you sure you want to reset changes? All unsaved work will be lost.",
            confirmText: "Reset",
            type: "warning"
        })) {
            window.location.reload();
        }
    };

    const getInitials = (name) => {
        if (!name) return "C";
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const avatarOptions = [
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0D8ABC&color=fff`,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&color=fff`,
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/bottts/svg?seed=Consult",
        "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(profile.name)
    ];

    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // Compress the image before setting to state
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
                setShowAvatarSelector(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-8 pt-14 md:pt-0 max-w-6xl mx-auto pb-10">
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
                    My Profile
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Manage your client account details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-2">
                    <div className="p-8 rounded-3xl profile-card space-y-8 backdrop-blur-sm bg-[var(--bg-card)] border border-[var(--border-color)]">
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#004AAD] flex items-center justify-center shadow-lg bg-gradient-to-br from-[#004AAD]/20 to-[#004AAD]/5 backdrop-blur-sm">
                                    {profile.image ? (
                                        <img
                                            src={profile.image}
                                            className="w-full h-full object-cover"
                                            alt="Client Profile"
                                        />
                                    ) : (
                                        <span className="text-4xl font-extrabold text-[#004AAD] drop-shadow-[0_2px_4px_rgba(0,74,173,0.2)] tracking-tighter">
                                            {getInitials(profile.name)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                                    className="absolute bottom-0 right-0 bg-[#004AAD] text-white p-3 rounded-full hover:bg-[#003882] transition-all duration-300 shadow-xl hover:scale-110 ring-4 ring-[var(--bg-main)]"
                                    title="Change Avatar"
                                >
                                    <Camera size={20} />
                                </button>
                            </div>

                            {showAvatarSelector && (
                                <div className="mt-6 w-full animate-in fade-in zoom-in duration-300 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] shadow-inner">
                                    <p className="text-xs font-bold uppercase mb-3 text-center text-gray-500">Pick an Avatar or Upload</p>

                                    {/* Upload Button */}
                                    <label className="flex items-center justify-center gap-2 w-full p-2 mb-4 rounded-lg border border-dashed border-gray-500 text-sm text-gray-400 hover:text-[#004AAD] hover:border-[#004AAD] cursor-pointer transition-colors bg-transparent">
                                        <Camera size={16} />
                                        <span>Upload from Gallery</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
                                    </label>

                                    <div className="flex flex-wrap justify-center gap-3">
                                        {avatarOptions.map((imgUrl, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAvatarSelect(imgUrl)}
                                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${profile.image === imgUrl ? 'border-primary ring-2 ring-primary/50 scale-110' : 'border-transparent hover:scale-105 hover:border-gray-400'}`}
                                            >
                                                <img src={imgUrl} alt={`Avatar option ${index}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <h2 className="text-xl font-bold text-[#004AAD]">
                                    {profile.name || "Client Name"}
                                </h2>
                                <p className="text-sm text-gray-400 mt-2">
                                    {profile.email || "Email"}
                                </p>
                                <p className="text-sm font-bold text-[#004AAD] mt-3 bg-[#004AAD]/10 px-4 py-1.5 rounded-full inline-block">
                                    {profile.companyName || "Valued Partner"}
                                </p>
                            </div>
                        </div>

                        {/* Client Status Info */}
                        <div className="space-y-4">
                            <div className="p-4 bg-[var(--bg-main)]/50 rounded-xl border border-[var(--border-color)] text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Account Status</p>
                                <p className="text-green-500 font-bold flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Active
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Form Fields */}
                <div className="lg:col-span-3">
                    <div className="p-8 rounded-3xl profile-form space-y-8 backdrop-blur-sm bg-[var(--bg-card)] border border-[var(--border-color)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <User size={18} className="text-[#004AAD]" />
                                    Full Name
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm"
                                    placeholder="Enter your full name"
                                    value={profile.name}
                                    onChange={handleInputChange('name')}
                                />
                            </div>

                            {/* Company Name */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <Building size={18} className="text-[#004AAD]" />
                                    Company Name
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm"
                                    placeholder="Your Company Ltd."
                                    value={profile.companyName}
                                    onChange={handleInputChange('companyName')}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <Mail size={18} className="text-[#004AAD]" />
                                    Email Address
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm cursor-not-allowed opacity-70"
                                    placeholder="email@example.com"
                                    type="email"
                                    value={profile.email}
                                    readOnly
                                    title="Contact support to change email"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <Phone size={18} className="text-[#004AAD]" />
                                    Phone Number
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm"
                                    placeholder="+1 (555) 000-0000"
                                    value={profile.phone}
                                    onChange={handleInputChange('phone')}
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <MapPin size={18} className="text-[#004AAD]" />
                                    Location
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm"
                                    placeholder="City, Country"
                                    value={profile.location}
                                    onChange={handleInputChange('location')}
                                />
                            </div>

                            {/* Website */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                    <Globe size={18} className="text-[#004AAD]" />
                                    Website
                                </label>
                                <input
                                    className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm"
                                    placeholder="www.example.com"
                                    value={profile.website}
                                    onChange={handleInputChange('website')}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#004AAD]">
                                <FileText size={18} className="text-[#004AAD]" />
                                About Us / Bio
                            </label>
                            <textarea
                                rows={4}
                                className="w-full p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[#004AAD] focus:outline-none focus:ring-2 focus:ring-[#004AAD]/20 transition-all duration-300 placeholder-gray-500 text-[var(--text-primary)] shadow-sm resize-none"
                                placeholder="Brief description of your company..."
                                value={profile.bio}
                                onChange={handleInputChange('bio')}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 pt-6">
                            <button
                                onClick={saveProfile}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#004AAD] hover:bg-[#003882] !text-white font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-[#004AAD]/50 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <Save size={20} />
                                )}
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={resetProfile}
                                className="px-8 py-4 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all duration-300 shadow-lg hover:scale-105 border border-gray-600"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
