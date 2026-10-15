import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiEye } from "react-icons/fi";

export default function EmployeeActivity() {
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState("Attendance");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadActivities = () => {
      // Need to retrieve all activities first, not just filtered local state if we want to update them
      // But we can update the main storage directly when verifying.
      const storedActivities = JSON.parse(localStorage.getItem("employeeActivities")) || [];
      const storedReports = JSON.parse(localStorage.getItem("employeeReports")) || [];

      // Combine activities with reports
      const combined = storedActivities.map((activity, index) => {
        const report = storedReports.find(r => r.employeeId === activity.employeeId && r.date === activity.date);
        return {
          ...activity,
          originalIndex: index, // Keep track of original index for updates
          report: report ? report.text : "No report submitted",
          reportTime: report ? report.time : null,
          reportFile: report ? report.fileName : null,
          reportData: report ? report.fileData : null,
        };
      });

      // Filter out admin and manager accounts so only employee activities are shown
      const filtered = combined.filter(a => {
        const role = (a.role || a.userRole || "").toString().toLowerCase();
        return role === "employee";
      });

      setActivities(filtered);
    };

    loadActivities();
    const interval = setInterval(loadActivities, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const verifyAttendance = (originalIndex) => {
    const storedActivities = JSON.parse(localStorage.getItem("employeeActivities")) || [];
    if (storedActivities[originalIndex]) {
      storedActivities[originalIndex].status = "Verified";
      localStorage.setItem("employeeActivities", JSON.stringify(storedActivities));
      // Re-load will happen automatically via interval or we can force it
      // For instant feedback:
      const updatedList = [...activities];
      const activityToUpdate = updatedList.find(a => a.originalIndex === originalIndex);
      if (activityToUpdate) activityToUpdate.status = "Verified";
      setActivities(updatedList);
    }
  };

  useEffect(() => {
    const loadTasks = () => {
      const stored = JSON.parse(localStorage.getItem("employeeTasks")) || [];
      setTasks(stored);
    };

    loadTasks();
    const i = setInterval(loadTasks, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <h1 className="text-2xl font-bold text-primary">Employee Activity</h1>

      {/* TABS */}
      <div className="flex gap-2 border-b border-theme mb-4">
        {['Attendance', 'Daily Report', 'Tasks'].map(t => (
          <button
            key={t}
            className={`px-4 py-2 font-bold focus:outline-none transition border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-theme-secondary hover:text-primary'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {/* TAB CONTENTS */}
      {tab === 'Attendance' && (
        <div className="space-y-4">
          {(() => {
            const groupActivitiesByDate = (list) => {
              const groups = {};
              list.forEach(item => {
                let dateKey = item.date;
                if (!dateKey) return;

                const today = new Date().toLocaleDateString();
                const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

                if (dateKey === today) dateKey = "Today";
                else if (dateKey === yesterday) dateKey = "Yesterday";

                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(item);
              });
              return groups;
            };

            const grouped = groupActivitiesByDate(activities);
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
              if (a === "Today") return -1;
              if (b === "Today") return 1;
              if (a === "Yesterday") return -1;
              if (b === "Yesterday") return 1;
              return new Date(b) - new Date(a);
            });

            if (sortedKeys.length === 0) return <p className="text-gray-400">No attendance records found.</p>;

            return sortedKeys.map(dateLabel => (
              <div key={dateLabel}>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">{dateLabel}</h3>
                <div className="space-y-2">
                  {grouped[dateLabel].map((emp, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-card)] shadow-sm flex flex-col md:flex-row md:items-center md:gap-6 border border-[var(--border-color)]">
                      <div className="flex-1">
                        <p className="font-medium text-base text-[var(--text-primary)]">{emp.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{emp.role}</p>
                      </div>
                      <div className="flex flex-col md:flex-row md:gap-4 mt-2 md:mt-0 items-end">
                        <div className="flex flex-col text-right mr-4">
                          <span className="text-[#004AAD] font-bold">
                            In: {emp.checkIn}
                          </span>
                          {emp.checkOut && (
                            <span className="text-[#004AAD] font-bold">
                              Out: {emp.checkOut}
                            </span>
                          )}
                        </div>

                        {/* Verification Status */}
                        {emp.status === "Verified" ? (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold border border-green-500/20">
                            Verified ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => verifyAttendance(emp.originalIndex)}
                            className="px-4 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs font-bold transition-all"
                          >
                            Verify Attendance
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {tab === 'Daily Report' && (
        <div className="space-y-4">
          {(() => {
            // 1. Deduplicate
            const seen = new Set();
            const uniqueActivities = activities.filter(a => {
              const key = `${a.employeeId}-${a.date}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            if (uniqueActivities.length === 0) return <p className="text-gray-400">No reports found.</p>;

            // 2. Group by Date
            const groups = {};
            uniqueActivities.forEach(item => {
              let dateKey = item.date;
              if (!dateKey) return;

              const today = new Date().toLocaleDateString();
              const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

              if (dateKey === today) dateKey = "Today";
              else if (dateKey === yesterday) dateKey = "Yesterday";

              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(item);
            });

            // 3. Sort Keys
            const sortedKeys = Object.keys(groups).sort((a, b) => {
              if (a === "Today") return -1;
              if (b === "Today") return 1;
              if (a === "Yesterday") return -1;
              if (b === "Yesterday") return 1;
              return new Date(b) - new Date(a);
            });

            // 4. Render Groups
            return sortedKeys.map(dateLabel => (
              <div key={dateLabel}>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">{dateLabel}</h3>
                <div className="space-y-2">
                  {groups[dateLabel].map((emp, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[var(--bg-card)] shadow-sm flex flex-col md:flex-row md:items-start md:gap-6 border border-[var(--border-color)]">
                      <div className="flex-1">
                        <p className="font-medium text-base">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.role}</p>
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-[#004AAD] font-bold">Daily Report</p>
                          {emp.reportTime && <span className="text-xs text-[#004AAD] font-bold font-mono">{emp.reportTime}</span>}
                        </div>
                        <p className="text-sm mt-1 text-[var(--text-primary)]">{emp.report}</p>

                        {emp.reportData && (
                          <div className="mt-2">
                            {(() => {
                              const isPdf = typeof emp.reportData === 'string' && (emp.reportData.startsWith('data:application/pdf') || emp.reportData.toLowerCase().endsWith('.pdf') || emp.reportData.includes('cloudinary.com') && emp.reportFile?.toLowerCase().endsWith('.pdf'));
                              
                              return (
                                <>
                                  <button
                                    onClick={() => setSelectedImage({ url: emp.reportData, type: isPdf ? 'pdf' : 'image' })}
                                    className="text-xs text-blue-500 underline hover:text-blue-400 flex items-center gap-1 mb-2"
                                  >
                                    🔗 View Attachment ({emp.reportFile})
                                  </button>

                                  {isPdf ? (
                                    <div
                                      className="h-32 w-24 rounded-lg border border-red-200 bg-red-50 text-red-500 cursor-pointer hover:bg-red-100 flex flex-col items-center justify-center shadow-sm transition-all"
                                      onClick={() => setSelectedImage({ url: emp.reportData, type: 'pdf' })}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-[10px] font-bold mt-1">PDF REPORT</span>
                                    </div>
                                  ) : emp.reportData.startsWith('data:image') || emp.reportData.includes('cloudinary.com') ? (
                                    <img
                                      src={emp.reportData}
                                      alt="Preview"
                                      onClick={() => setSelectedImage({ url: emp.reportData, type: 'image' })}
                                      className="h-32 w-auto rounded-lg border border-[var(--border-color)] cursor-pointer hover:opacity-80 object-cover shadow-sm"
                                    />
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-primary">Assigned Tasks</h2>
          {tasks.filter(task => !task.milestone).map((task, i) => (
            <div key={i} className="p-2 rounded-lg bg-[var(--bg-card)] shadow-sm flex flex-col md:flex-row md:items-center md:gap-6">
              <div className="flex-1">
                <p className="font-medium text-base">{task.title}</p>
                <p className="text-xs text-gray-400">{task.project || "No Project"}  {task.employee || "Employee"}</p>
                <span className="text-xs text-purple-400">{task.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Milestones' && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-primary">Milestones / Progress</h2>
          {tasks.filter(task => task.milestone).map((task, i) => (
            <div key={i} className="p-2 rounded-lg bg-[var(--bg-card)] shadow-sm flex flex-col md:flex-row md:items-center md:gap-6">
              <div className="flex-1">
                <p className="font-medium text-base">{task.title}</p>
                <p className="text-xs text-gray-400">{task.project || "No Project"}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <span className="text-xs text-theme-secondary">Progress:</span>
                <progress value={task.progress || 0} max="100" className="w-32 h-2 align-middle" />
                <span className="text-xs text-theme-primary">{task.progress || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-[90vw] md:w-auto max-w-5xl bg-transparent p-2 rounded-2xl shadow-2xl flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute -top-12 right-0 flex gap-4">
                <a 
                  href={selectedImage.url} 
                  download 
                  className="text-white hover:text-blue-400 font-bold text-sm flex items-center gap-2 transition-colors bg-white/10 px-4 py-2 rounded-lg"
                >
                  <FiDownload size={18} /> Download
                </a>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-white hover:text-red-500 font-bold text-sm flex items-center gap-2 transition-colors bg-white/10 px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>

              {selectedImage?.type === 'pdf' ? (
                (() => {
                  let pdfUrl = selectedImage.url;
                  if (typeof pdfUrl === 'string' && pdfUrl.startsWith('data:application/pdf;base64,')) {
                    try {
                      const base64Data = pdfUrl.split(',')[1];
                      const byteCharacters = atob(base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: 'application/pdf' });
                      pdfUrl = URL.createObjectURL(blob);
                    } catch (e) {
                      console.error("PDF Blob conversion failed", e);
                    }
                  }

                  const isCloudinary = pdfUrl.includes('cloudinary.com');
                  const previewUrl = isCloudinary 
                    ? pdfUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1').replace(/\/upload\//, '/upload/pg_1,w_1000,c_limit,q_auto,f_auto/')
                    : pdfUrl;
                  
                  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
                  const finalIframeUrl = (pdfUrl.startsWith('http') && !isCloudinary) ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : (isCloudinary ? googleDocsUrl : pdfUrl);

                  return (
                    <div className="w-[85vw] md:w-[900px] h-[80vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border-4 border-white/10">
                      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 pl-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">Activity Proof PDF</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
                          >
                            <FiEye size={14} /> Full Screen / Fix Blank
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-white relative flex items-center justify-center overflow-hidden">
                        {/* LOADING INDICATOR */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-0">
                          <div className="w-10 h-10 border-4 border-[#004AAE] border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-400 font-bold animate-pulse text-xs tracking-widest uppercase">Initialising Preview...</p>
                        </div>

                        {isCloudinary ? (
                          <img 
                            src={previewUrl} 
                            alt="PDF Preview" 
                            className="max-w-full max-h-full object-contain shadow-sm z-10"
                            onLoad={(e) => {
                              e.target.previousSibling.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <iframe
                          src={finalIframeUrl}
                          style={{ display: isCloudinary ? 'none' : 'block' }}
                          className="w-full h-full border-0 bg-white z-10"
                          title="PDF Preview"
                          onLoad={(e) => {
                              try {
                                  const loadingDiv = e.target.parentElement.firstChild;
                                  if(loadingDiv) loadingDiv.style.display = 'none';
                              } catch(err) {}
                          }}
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <img
                  src={selectedImage?.url || selectedImage}
                  alt="Full view"
                  className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border-2 border-white/20"
                />
              )}
              <p className="mt-4 text-white/60 text-sm font-medium">Click outside to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
