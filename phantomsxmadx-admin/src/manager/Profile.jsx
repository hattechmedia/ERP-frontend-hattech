import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    image: "",
    jobTitle: "",
    department: "",
    experience: "",
    skills: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("managerProfile");
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const saveProfile = () => {
    localStorage.setItem("managerProfile", JSON.stringify(profile));
    toast.success("Profile saved");
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
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
        setProfile({ ...profile, image: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 pt-14 md:pt-0 max-w-4xl mx-auto">
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
        <h1 className="text-4xl font-bold text-[#004AAE] animate-pulse">
          Manager Profile
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Manage your managerial information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="p-8 rounded-3xl profile-card space-y-8 backdrop-blur-sm">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#004AAE] flex items-center justify-center shadow-lg">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      className="w-full h-full object-cover"
                      alt="Manager Profile"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-[#004AAE]">
                      {profile.name ? profile.name[0].toUpperCase() : "M"}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#004AAE] !text-white p-3 rounded-full cursor-pointer hover:bg-[#003882] transition-all duration-300 shadow-lg hover:scale-110">
                  <input type="file" onChange={handleImage} className="hidden" />
                  Update
                </label>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-xl font-bold text-white">
                  {profile.name || "Manager Name"}
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  {profile.email || "Email"}
                </p>
                <p className="text-sm text-blue-300 mt-1">
                  {profile.department || "Department"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-3xl profile-form space-y-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Your Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              {/* Email */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              {/* Phone */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Phone Number"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
              {/* Job Title */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Job Title"
                value={profile.jobTitle}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              />
              {/* Department */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Department"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              />
              {/* Experience */}
              <input
                className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg cursor-pointer"
                placeholder="Years of Experience"
                type="number"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              />
            </div>
            {/* Skills */}
            <textarea
              className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg resize-none cursor-pointer"
              placeholder="Skills"
              rows={2}
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            />
            {/* Bio */}
            <textarea
              className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-[#004AAE]/30 focus:border-[#004AAE] focus:outline-none focus:ring-2 focus:ring-[#004AAE]/20 transition-all duration-300 placeholder-gray-400 text-white shadow-lg resize-none cursor-pointer"
              placeholder="Short bio"
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            {/* Save Button */}
            <button
              onClick={saveProfile}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-[#004AAE] hover:bg-[#003882] !text-white font-bold text-lg transition-all duration-500 shadow-2xl hover:shadow-[#004AAE]/50 transform hover:scale-105 animate-pulse cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}