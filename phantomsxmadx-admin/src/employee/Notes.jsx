import { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiLayers, FiUser, FiClock, FiShare2 } from "react-icons/fi";
import api from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Notes() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [notesLoading, setNotesLoading] = useState(false);
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

    // Fetch employee's assigned projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                // We fetch all projects and filter by team membership on client side or use a dedicated endpoint
                // Assuming /api/projects returns projects the user is involved in or all for now
                const res = await api.get('/projects');
                if (res.data.success) {
                    const userProjects = res.data.data.filter(p => 
                        p.team?.some(member => (member._id || member) === currentUser.id)
                    );
                    setProjects(userProjects);
                    if (userProjects.length > 0) {
                        setSelectedProject(userProjects[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch projects", err);
                toast.error("Failed to load projects");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Fetch notes for selected project
    useEffect(() => {
        if (!selectedProject) return;

        const fetchNotes = async () => {
            try {
                setNotesLoading(true);
                const res = await api.get(`/notes/${selectedProject._id}`);
                if (res.data.success) {
                    setNotes(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch notes", err);
            } finally {
                setNotesLoading(false);
            }
        };

        fetchNotes();
        // Set up polling for collaboration
        const interval = setInterval(fetchNotes, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [selectedProject]);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim() || !selectedProject) return;

        try {
            const res = await api.post(`/notes/${selectedProject._id}`, { content: newNote });
            if (res.data.success) {
                setNotes([res.data.data, ...notes]);
                setNewNote("");
                toast.success("Note added!");
            }
        } catch (err) {
            console.error("Failed to add note", err);
            toast.error("Cloud not save note");
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Delete this point?")) return;

        try {
            const res = await api.delete(`/notes/delete/${noteId}`);
            if (res.data.success) {
                setNotes(notes.filter(n => n._id !== noteId));
                toast.success("Note removed");
            }
        } catch (err) {
            console.error("Failed to delete note", err);
            toast.error("Failed to delete");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your projects...</div>;

    return (
        <div className="space-y-6 pt-14 md:pt-0 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FiEdit className="text-yellow-500" /> Project Workspace Notes
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Collaborative scratchpad for project points & tasks</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Active Project:</span>
                    <select
                        value={selectedProject?._id}
                        onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] text-white text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-bold min-w-[200px]"
                    >
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.title}</option>
                        ))}
                        {projects.length === 0 && <option disabled>No assigned projects</option>}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* PROJECT INFO SIDEBAR */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FiLayers /> Project Summary
                        </h3>
                        {selectedProject ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-white leading-tight">{selectedProject.title}</p>
                                    <p className="text-xs text-blue-500 font-bold mt-1 uppercase">{selectedProject.client?.name || "Client Project"}</p>
                                </div>
                                <div className="h-px bg-[var(--border-color)]"></div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <FiUser size={14} />
                                    <span className="text-xs font-medium">{selectedProject.team?.length} Team Members</span>
                                </div>
                                <p className="text-xs text-gray-500 italic leading-relaxed">
                                    Notes written here are shared with everyone on the team and visible to Admin.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 py-4 italic text-center">Select a project to start writing notes.</p>
                        )}
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 shadow-lg">
                         <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FiShare2 /> Collaborative Mode
                         </h4>
                         <p className="text-[10px] text-gray-400 leading-normal">
                             This workspace updates automatically. When a teammate adds a point, it will appear here for everyone. Use this for project-specific instructions, passwords, or daily goals.
                         </p>
                    </div>
                </div>

                {/* NOTES FEED */}
                <div className="lg:col-span-3 space-y-6">
                    {/* INPUT AREA */}
                    <form onSubmit={handleAddNote} className="relative group">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder={selectedProject ? `Write a point for ${selectedProject.title}...` : "Select a project first..."}
                            disabled={!selectedProject}
                            className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] focus:border-yellow-500/50 rounded-2xl p-4 pr-32 min-h-[120px] text-white outline-none transition-all resize-none shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-[var(--border-color)]/80"
                        />
                        <button
                            type="submit"
                            disabled={!selectedProject || !newNote.trim()}
                            className="absolute bottom-4 right-4 bg-[#004AAE] hover:bg-[#003882] disabled:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-tighter flex items-center gap-2 transition-all shadow-xl active:scale-95 disabled:scale-100"
                        >
                            <FiPlus size={18} /> Add Note
                        </button>
                    </form>

                    {/* LIST OF NOTES */}
                    <div className="space-y-4">
                        {notesLoading && notes.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Waking up workspace...</p>
                            </div>
                        )}
                        
                        {!notesLoading && notes.length === 0 && selectedProject && (
                            <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl">
                                <FiEdit size={40} className="mx-auto text-gray-700 mb-4" />
                                <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No notes yet in this project</p>
                                <p className="text-[10px] text-gray-600 mt-2 italic">Be the first to share a project point!</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {notes.map((note) => (
                                <motion.div
                                    key={note._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-yellow-500/5 transition-all relative group overflow-hidden"
                                >
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={note.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(note.author?.firstName || 'User')}`}
                                                className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5"
                                                alt="Author"
                                            />
                                            <div>
                                                <p className="text-xs font-black text-[#004AAE] transition-colors leading-tight">
                                                    {note.author?.name || `${note.author?.firstName || ''} ${note.author?.lastName || note.author?.username || 'User'}`}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-bold mb-0.5">
                                                    {note.author?.email || note.author?.username || ''}
                                                </p>
                                                <p className="text-[10px] text-gray-600 flex items-center gap-1 font-bold">
                                                    <FiClock size={10} /> {new Date(note.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {(note.author?._id === currentUser.id || ['admin', 'projecthead'].includes(currentUser.role)) && (
                                            <button
                                                onClick={() => handleDeleteNote(note._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Note"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-[14px] text-black leading-relaxed whitespace-pre-wrap font-black pl-11">
                                        {note.content}
                                    </div>
                                    
                                    {/* Subtle decorative element */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
