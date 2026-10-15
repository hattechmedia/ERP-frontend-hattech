
import { useState } from "react";
import { toast } from "react-hot-toast";

const categories = [
  "Web Developer",
  "Graphic Designer",
  "QA Engineer",
  "YouTube Automation",
  "AI ML",
  "Intern"
];
const subcategories = {
  "Web Developer": ["MERN Stack", "PHP LARAVEL DEVELOPER", "Web Designer"],
  "Graphic Designer": ["UI/UX", "Illustrator", "Animator"],
  "QA Engineer": ["Manual", "Automation"],
  "YouTube Automation": ["Channel Management", "Script Writing", "Video Optimization", "Thumbnail Design"],
  "AI ML": ["Data Scientist", "Machine Learning Engineer", "AI Researcher", "NLP Specialist"],
  "Intern": ["Web Developer", "App Developer", "QA Engineer", "YouTube Automation", "AI ML", "Graphic Designer", "Video Editor", "SEO Specialist", "Digital Marketing", "SMM Specialist", "Content Writer", "Management"]
};

export default function AddEmployee() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    image: "",
    role: "",
    subcategory: "",
    phone: "",
    department: "",
    joining: ""
  });

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <h1 className="text-2xl font-bold text-primary">Add Employee</h1>
      <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm max-w-lg mx-auto">
        <form
          onSubmit={e => {
            e.preventDefault();
            // Save new employee
            const newEmp = {
              ...form,
              id: Date.now(),
            };
            const employees = JSON.parse(localStorage.getItem("employees")) || [];
            employees.push(newEmp);
            localStorage.setItem("employees", JSON.stringify(employees));
            setForm({ name: "", email: "", password: "", bio: "", image: "", role: "", subcategory: "", phone: "", department: "", joining: "" });
            toast.success("Employee added successfully!");
          }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <input
              className="flex-1 min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              placeholder="Ahmed Ali"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="flex-1 min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              placeholder="ahmed@example.pk"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <input
              className="flex-1 min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              placeholder="Password"
              type="password"
              value={form.password || ""}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
            <input
              className="flex-1 min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              placeholder="Phone"
              value={form.phone || ""}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="flex-1 min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              placeholder="Department"
              value={form.department || ""}
              onChange={e => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <input
            className="w-full min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
            placeholder="Bio"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
          />
          <input
            className="w-full min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
            placeholder="Joining Date (YYYY-MM-DD)"
            value={form.joining || ""}
            onChange={e => setForm({ ...form, joining: e.target.value })}
            type="date"
          />
          {/* Role Dropdown */}
          <select
            className="w-full min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value, subcategory: "" })}
            required
          >
            <option value="">Select Role</option>
            {categories.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {/* Subcategory Dropdown */}
          {form.role && subcategories[form.role] && (
            <select
              className="w-full min-w-0 p-2 rounded bg-transparent border border-theme text-theme-primary"
              value={form.subcategory}
              onChange={e => setForm({ ...form, subcategory: e.target.value })}
              required
            >
              <option value="">Select Subcategory</option>
              {subcategories[form.role].map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-full font-bold shadow bg-gradient-to-r from-primary to-purple-500 text-white border-2 border-primary hover:from-purple-600 hover:to-primary hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ fontSize: '1rem', letterSpacing: '0.03em' }}
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
