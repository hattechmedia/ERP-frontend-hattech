import { useState, useEffect } from "react";
import { FiSend, FiFileText, FiClock, FiCheckCircle, FiShield, FiX, FiMessageSquare, FiRefreshCw, FiEye } from "react-icons/fi";
import api from "../services/api";
import LinkifyText from "../components/LinkifyText";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyReport() {
  const [report, setReport] = useState("");
  const [images, setImages] = useState([]); // Array of Base64 strings
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [markingStatus, setMarkingStatus] = useState("");
  const [editingId, setEditingId] = useState(null);

  const isSunday = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    return d.getDay() === 0 && dateStr !== '2026-06-28';
  })();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const userId = user.userId || user.id;
      const res = await api.get(`/reports${userId ? `?userId=${userId}` : ""}`);
      if (res.data.success) {
        setReports(res.data.data || res.data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const processFile = (file) => {
    // For PDFs, restrict size to 2MB (2 * 1024 * 1024 bytes) to prevent DB freezing
    if (file.type === 'application/pdf' && file.size > 2 * 1024 * 1024) {
      toast.error(`The PDF "${file.name}" is too large! Maximum allowed size is 2MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImages(prev => [...prev, { data: dataUrl, type: file.type, name: file.name || `Pasted Image ${new Date().getTime()}` }]);
        };
        img.src = event.target.result;
      } else {
        // PDFs or other file types
        setImages(prev => [...prev, { data: event.target.result, type: file.type, name: file.name }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach(processFile);
  };

  // ADD PASTE FUNCTIONALITY
  useEffect(() => {
    const handlePaste = (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let imageCount = 0;
      
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          processFile(blob);
          imageCount++;
        }
      }

      if (imageCount > 0) {
        toast.success(`Pasted ${imageCount} image${imageCount > 1 ? 's' : ''} successfully!`, {
          icon: '📋',
          style: {
            borderRadius: '10px',
            background: '#004AAE',
            color: '#fff',
          },
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report.trim()) return toast.error("Please type your report.");

    try {
      setSubmitting(true);
      const base64Strings = images.map(img => img.data || img);
      
      let res;
      if (editingId) {
          res = await api.put(`/reports/${editingId}`, {
              report: report.trim(),
              images: base64Strings
          });
      } else {
          // Send local date as YYYY-MM-DD to avoid UTC off-by-one timezone bug
          const now = new Date();
          const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          res = await api.post('/reports', {
            report: report.trim(),
            date: localDate,
            images: base64Strings
          });
      }

      if (res.data.success) {
        toast.success(editingId ? "Report updated successfully!" : "Daily report submitted successfully!");
        setReport("");
        setImages([]);
        setEditingId(null);
        fetchReports();
      }
    } catch (err) {
      console.error("Failed to process report", err);
      toast.error(err.response?.data?.message || "Failed to process report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
      setEditingId(item._id);
      setReport(item.report);
      setImages(item.images || []);
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Daily Report</h1>
          <p className="text-sm text-gray-400">Submit your work progress for today</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SUBMISSION FORM */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FiFileText />
              <span>What did you work on today?</span>
              {isSunday && <span className="ml-auto text-red-500 text-xs bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">SUNDAYS ARE NON-WORKING DAYS</span>}
            </div>

            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              disabled={isSunday}
              className={`w-full h-32 p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary outline-none resize-none transition-all ${isSunday ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              placeholder={isSunday ? "Report submission is disabled today." : "List your tasks, accomplishments, and challenges..."}
            />

            {/* MARKED IMAGE UPLOAD AREA */}
            <div className={`space-y-3 ${isSunday ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">
                Work Screenshots <span className="text-gray-400 font-normal">(Optional)</span>
              </label>

              <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-main)]/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                  <FiFileText size={24} />
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-primary transition-colors">Click or Paste to Upload Screenshots</p>
                <p className="text-xs text-gray-400 mt-1">Select from computer or use Ctrl+V to paste multiple images</p>
              </div>

              {/* IMAGE / FILE PREVIEWS */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2 animate-in fade-in zoom-in duration-300">
                  {images.map((fileObj, idx) => {
                    const isPdf = fileObj.type === 'application/pdf' || (typeof fileObj === 'string' && (fileObj.startsWith('data:application/pdf') || fileObj.toLowerCase().endsWith('.pdf')));
                    const imgSrc = fileObj.data || fileObj;

                    return (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] group shadow-sm bg-[var(--bg-main)] flex items-center justify-center">
                        {isPdf ? (
                          <div className="flex flex-col items-center text-red-500">
                            <FiFileText size={32} />
                            <span className="text-[10px] mt-2 font-bold px-2 truncate w-full text-center">{fileObj.name || "PDF Document"}</span>
                          </div>
                        ) : (
                          <img src={imgSrc} className="w-full h-full object-cover" alt={`preview ${idx}`} />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                          >
                            <FiCheckCircle className="rotate-45" size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting || isSunday}
                className={`px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 ${isSunday ? 'grayscale pointer-events-none' : ''}`}
              >
                {isSunday ? "Submission Blocked" : (editingId ? "Update Report" : "Submit Report")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setReport("");
                    setImages([]);
                  }}
                  className="px-6 py-3 text-gray-500 hover:text-gray-700 font-bold transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RECENT HISTORY */}
        <div className="space-y-4">
          <h2 className="font-bold flex items-center gap-2 text-primary">
            <FiClock /> Previous Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No reports submitted yet.</p>
            ) : (
              reports.map((item) => (
                <div key={item._id} className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 flex items-center gap-1">
                      {item.isEdited && (
                        <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 flex items-center gap-1 shadow-sm">
                          <FiClock size={10} />
                          EDITED
                        </div>
                      )}
                      {item.status === 'verified' && (
                        <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1 flex items-center gap-1 shadow-sm">
                          <FiShield size={10} />
                          VERIFIED
                        </div>
                      )}
                    </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-primary/50" />
                      <span className="text-sm font-bold text-primary">
                        {(() => {
                          const d = item.date;
                        if (d && typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
                            const [y, mo, day] = d.split('T')[0].split('-').map(Number);
                            return new Date(y, mo - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        }
                        return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        })()}
                      </span>
                    </div>
                    {item.status === 'verified' ? (
                      <FiCheckCircle className="text-green-500" title="Verified by Management" />
                    ) : item.status === 'rejected' ? (
                      <div className="flex items-center gap-1 text-red-500 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                         <FiX size={10} /> REJECTED
                      </div>
                    ) : item.status === 'revision' ? (
                      <div className="flex items-center gap-1 text-yellow-600 font-bold text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                         <FiRefreshCw size={10} className="animate-spin-slow" /> REVISION
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(() => {
                           // Show edit button if created within 10 minutes
                           const diff = (new Date() - new Date(item.createdAt)) / (1000 * 60);
                           if (diff <= 10) {
                               return (
                                   <button 
                                      onClick={() => handleEdit(item)}
                                      className="text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded-lg font-black transition-all flex items-center gap-1"
                                   >
                                      <FiFileText size={10} /> EDIT (10m)
                                   </button>
                               );
                           }
                           return null;
                        })()}
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-bold">Pending Approval</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl mb-4 min-h-[60px]">
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                      <LinkifyText text={item.report} />
                    </p>
                  </div>

                  {item.feedback && (
                    <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <p className="text-[10px] font-black text-orange-600 uppercase mb-1 flex items-center gap-1">
                        <FiMessageSquare size={12} /> Feedback from Auditor:
                      </p>
                      <p className="text-xs text-orange-700 italic">
                        "{item.feedback}"
                      </p>
                    </div>
                  )}

                  {/* FILES IN HISTORY */}
                  {item.images && item.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)]/50">
                      {item.images.map((fileStr, idx) => {
                        const isPdf = fileStr.startsWith('data:application/pdf') || fileStr.toLowerCase().endsWith('.pdf');
                        return (
                          <div key={idx} className="relative group/img">
                            {isPdf ? (
                              <div
                                onClick={() => setPreviewFile({ type: 'pdf', url: fileStr })}
                                className="w-16 h-16 rounded-lg bg-red-50 text-red-500 flex flex-col items-center justify-center border border-red-200 cursor-pointer hover:scale-105 transition-transform"
                                title="View PDF"
                              >
                                <FiFileText size={24} />
                                <span className="text-[8px] font-bold mt-1">PDF</span>
                              </div>
                            ) : (
                              <img
                                src={fileStr}
                                className="w-16 h-16 rounded-lg bg-gray-100 object-cover border border-[var(--border-color)] cursor-pointer hover:scale-105 transition-transform"
                                alt="Job Proof"
                                onClick={() => setPreviewFile({ type: 'image', url: fileStr })}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* INLINE FILE PREVIEW MODAL */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90vw] md:w-auto max-w-5xl bg-transparent p-2 rounded-2xl shadow-2xl flex justify-center items-center"
              onClick={e => e.stopPropagation()}
            >
              {previewFile?.type === 'pdf' ? (
                (() => {
                  let pdfUrl = previewFile.url;
                  if (pdfUrl.startsWith('data:application/pdf;base64,')) {
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
                  // Fix: don't append toolbar to base64 URLs
                  const finalIframeUrl = (pdfUrl.startsWith('http') && !isCloudinary) ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : (isCloudinary ? googleDocsUrl : pdfUrl);

                  return (
                    <div className="w-[85vw] md:w-[900px] h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border-4 border-white/10">
                      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 pl-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">Report View</span>
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
                  src={previewFile?.url || previewFile}
                  alt="Full Preview"
                  className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
                />
              )}
              <button
                className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors z-50 hover:scale-110 transform duration-200"
                onClick={() => setPreviewFile(null)}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
