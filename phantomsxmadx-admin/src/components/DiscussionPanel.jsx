import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function DiscussionPanel({ selectedProject, userRole, onClose, projects, onSelectProject }) {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to project discussion! Select a project to start chatting.", sender: "system", timestamp: "10:00 AM", project: null },
    { id: 2, text: "Let's discuss the Admin ERP Panel requirements", sender: "admin", timestamp: "10:30 AM", project: "Admin ERP Panel" },
    { id: 3, text: "I've completed the initial design", sender: "employee", timestamp: "10:35 AM", project: "Admin ERP Panel" },
    { id: 4, text: "Website Redesign login page is ready for review", sender: "manager", timestamp: "11:00 AM", project: "Website Redesign" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedProject) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: userRole,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      project: selectedProject
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter messages for selected project
  const projectMessages = selectedProject
    ? messages.filter(msg => msg.project === selectedProject || msg.sender === "system")
    : messages.filter(msg => msg.sender === "system");

  // Overlay click handler
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("discussion-overlay")) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 discussion-overlay bg-black/30 backdrop-blur-[1px]" onClick={handleOverlayClick}>
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 w-full max-w-md min-w-[320px] sm:min-w-[400px] sm:max-w-[400px] rounded-lg shadow-xl border-theme overflow-hidden bg-theme-card"
          style={{
            maxWidth: '90vw',
            minWidth: '90vw',
            width: '90vw',
            ...(window.innerWidth >= 640 ? { minWidth: 400, maxWidth: 400, width: '100%' } : {})
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Animated button style for discussion project selection */}
          <style>{`
            @keyframes discuss-btn {
              0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.7); }
              70% { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
              100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
            }
            .animate-discuss-btn {
              animation: discuss-btn 1.5s infinite;
            }
          `}</style>
          {/* Header */}
          <div className="p-4 border-b border-theme bg-purple-900 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Project Discussion</h3>
                <p className="text-xs text-theme-secondary">
                  {userRole === "employee" ? "Chat with Team" :
                    userRole === "manager" ? "Manager Chat" : "Admin Chat"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-theme-secondary hover:text-theme-primary text-xl transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          {/* Project Selection */}
          <div className="p-4 border-b border-theme">
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Select Project to Discuss
            </label>
            <div className="flex flex-wrap gap-2">
              {projects.map((project, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectProject(project)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors relative overflow-hidden ${selectedProject === project
                    ? "bg-primary text-white animate-discuss-btn"
                    : "bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary"
                    }`}
                  style={selectedProject === project ? { boxShadow: "0 0 0 0 rgba(37,99,235,0.7)" } : {}}
                >
                  {project}
                  {selectedProject === project && (
                    <span className="absolute inset-0 rounded animate-discuss-btn" style={{ pointerEvents: "none" }}></span>
                  )}
                </button>
              ))}
            </div>
            {selectedProject && (
              <>
                <style>{`
                  @keyframes discuss-btn {
                    0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
                    100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
                  }
                  .animate-discuss-btn {
                    animation: discuss-btn 1.5s infinite;
                  }
                `}</style>
                <p className="text-xs text-primary mt-2">
                  Discussing: <span className="font-medium">{selectedProject}</span>
                </p>
              </>
            )}
          </div>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {projectMessages.length === 0 ? (
              <div className="text-center text-theme-muted text-sm py-8">
                Select a project to view discussions
              </div>
            ) : (
              projectMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === userRole ? "justify-end" :
                    msg.sender === "system" ? "justify-center" : "justify-start"
                    }`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${msg.sender === "system"
                    ? "bg-theme-tertiary text-theme-secondary text-center"
                    : msg.sender === userRole
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-theme-secondary text-theme-primary rounded-bl-none"
                    }`}>
                    <p className="text-sm">{msg.text}</p>
                    {msg.sender !== "system" && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs opacity-75">
                          {msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)}
                          {msg.project && ` • ${msg.project}`}
                        </span>
                        <span className="text-xs opacity-75 ml-2">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Input */}
          <div className="p-4 border-t border-theme">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedProject ? `Message about ${selectedProject}...` : "Select a project to start chatting"}
                disabled={!selectedProject}
                className={`flex-1 p-2 rounded border-theme focus:outline-none focus:ring-2 ring-theme-focus text-theme-primary transition-all ${selectedProject
                  ? "bg-theme-card border-theme"
                  : "bg-theme-tertiary border-theme-secondary cursor-not-allowed"
                  }`}
              />
              <button
                onClick={sendMessage}
                disabled={!selectedProject || !newMessage.trim()}
                className={`px-4 py-2 rounded transition-colors font-medium ${selectedProject && newMessage.trim()
                  ? "bg-primary hover:bg-primary-hover text-white shadow-md"
                  : "bg-theme-secondary text-theme-muted cursor-not-allowed"
                  }`}
              >
                Send
              </button>
            </div>
            {!selectedProject && (
              <p className="text-xs text-theme-muted mt-2 text-center">
                Please select a project to start chatting
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DiscussionPanel;