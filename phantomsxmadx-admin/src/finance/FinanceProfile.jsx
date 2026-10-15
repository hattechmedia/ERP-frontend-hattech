import { useState, useEffect, useRef } from "react";
import { FiCamera, FiSave, FiUser, FiMail, FiLock, FiSettings, FiBriefcase, FiMapPin, FiPhone } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function FinanceProfile() {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        designation: "Finance Manager",
        image: "",
        password: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile/finance');
            if (res.data.success) {
                setProfile(prev => ({
                    ...prev,
                    ...res.data.profile,
                    password: "" // Don't show password
                }));
            }
        } catch (err) {
            console.error("Failed to load finance profile", err);
            const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
            setProfile(prev => ({
                ...prev,
                name: currentUser.name || "",
                email: currentUser.email || ""
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
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
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setProfile(prev => ({ ...prev, image: dataUrl }));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/profile/finance', profile);
            if (res.data.success) {
                toast.success("Profile updated successfully!");
                // Update local storage for immediate UI updates
                const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
                const updatedUser = {
                    ...currentUser,
                    name: res.data.profile.name,
                    email: res.data.profile.email,
                    avatar: res.data.profile.image
                };
                sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
                
                // Trigger global profile update event
                window.dispatchEvent(new Event('profileUpdate'));
                
                setProfile(prev => ({ ...prev, password: "" }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 text-[var(--text-primary)]">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-[var(--bg-card)] p-8 md:p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#004AAD] shadow-[0_0_20px_rgba(0,74,173,0.5)]" />
                <div className="flex items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[32px] overflow-hidden border-2 border-[#004AAD] bg-[var(--bg-inner)] flex items-center justify-center shadow-xl transition-transform group-hover:scale-105 duration-500">
                            {profile.image ? (
                                <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-[#004AAD] uppercase">
                                    {profile.name?.charAt(0) || "F"}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="absolute -bottom-2 -right-2 p-3 bg-[#004AAD] text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all ring-4 ring-[var(--bg-card)]"
                        >
                            <FiCamera size={18} />
                        </button>
                        <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{profile.name || "Finance Executive"}</h2>
                        <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-[0.3em] opacity-80">Official Clearing Authority Profile</p>
                        <div className="flex flex-wrap gap-3 mt-4">
                           <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase border border-emerald-500/20 shadow-sm">Verified Account</span>
                           <span className="px-4 py-1.5 rounded-full bg-[#004AAD]/10 text-[#004AAD] text-[9px] font-black uppercase border border-[#004AAD]/20 shadow-sm">Executive Access</span>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-10 pb-5 border-b border-[var(--bg-inner)]">
                            <FiUser className="text-[#004AAD]" size={24} />
                            <h3 className="text-xl font-black uppercase tracking-tight">Identity Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Full Name / Signature</label>
                                <div className="relative">
                                    <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input required name="name" value={profile.name} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" placeholder="Enter formal name..." />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Official Email (Authentication)</label>
                                <div className="relative">
                                    <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input required type="email" name="email" value={profile.email} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Secure Password Refresh</label>
                                <div className="relative">
                                    <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input type="password" name="password" value={profile.password} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" placeholder="Leave blank to keep current..." />
                                </div>
                                <p className="text-[9px] text-[var(--text-secondary)] italic ml-1 opacity-60">Authentication refresh required for updates</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Executive Title</label>
                                <div className="relative">
                                    <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input name="designation" value={profile.designation} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-10 pb-5 border-b border-[var(--bg-inner)]">
                            <FiSettings className="text-[#004AAD]" size={24} />
                            <h3 className="text-xl font-black uppercase tracking-tight">Terminal Settings</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Contact Number</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input name="phone" value={profile.phone} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" placeholder="+1 (000) 000-0000" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] ml-1 tracking-widest">Office HQ Location</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    <input name="location" value={profile.location} onChange={handleInputChange} className="w-full finance-terminal-input pr-6 py-4 rounded-2xl outline-none transition-all font-black text-sm" placeholder="Corporate HQ, Building A" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[var(--bg-card)] p-10 rounded-[40px] border border-[var(--bg-inner)] shadow-2xl text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                            <FiSave size={36} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black uppercase tracking-tight mb-2">Sync Account</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold px-4">Permanent commitment of identity and credential changes.</p>
                        </div>
                        <button 
                            disabled={saving}
                            className="w-full py-5 bg-[#004AAD] text-white rounded-3xl font-black uppercase tracking-widest shadow-[0_25px_50px_-10px_rgba(0,74,173,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {saving ? 'SYNCING...' : 'COMMIT CHANGES'}
                        </button>
                    </div>

                    <div className="bg-[#1a1a2e] p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4">Security Advisory</h4>
                        <p className="text-white/40 text-[10px] font-bold leading-relaxed mb-6">
                            Updates to your credentials will trigger an audit log. Ensure all formal signatures match corporate records for financial clearing.
                        </p>
                        <div className="flex items-center gap-3 text-emerald-500">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest">System Secure Control</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
