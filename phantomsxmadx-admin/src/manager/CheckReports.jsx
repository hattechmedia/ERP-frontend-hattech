import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiDownload, FiEye } from "react-icons/fi";

export default function CheckReports() {
  const [reports, setReports] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadReports = () => {
      const storedReports = JSON.parse(localStorage.getItem("employeeReports")) || [];
      setReports(storedReports);
    };

    loadReports();
    const interval = setInterval(loadReports, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <h1 className="text-2xl font-semibold">Check Daily Reports</h1>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-gray-400">No reports submitted yet.</p>
        ) : (
          reports.map((report, i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--bg-card)]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{report.employeeName}</h3>
                  <p className="text-sm text-gray-400">
                    {report.date} • <span className="text-purple-500 font-bold font-mono">{report.time || "--:--:-- "}</span>
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm">{report.text}</p>
              {report.fileData && (
                <div className="mt-3">
                  {(() => {
                    const isPdf = typeof report.fileData === 'string' && (report.fileData.startsWith('data:application/pdf') || report.fileData.toLowerCase().endsWith('.pdf') || report.fileData.includes('cloudinary.com') && report.fileName?.toLowerCase().endsWith('.pdf'));
                    
                    return (
                      <>
                        <button
                          onClick={() => setSelectedImage({ url: report.fileData, type: isPdf ? 'pdf' : 'image' })}
                          className="text-xs text-blue-500 underline hover:text-blue-400 flex items-center gap-1 mb-2"
                        >
                          🔗 {report.fileName || "View Attachment"}
                        </button>

                        {isPdf ? (
                          <div
                            className="h-32 w-24 rounded-lg border border-red-200 bg-red-50 text-red-500 cursor-pointer hover:bg-red-100 flex flex-col items-center justify-center shadow-sm transition-all"
                            onClick={() => setSelectedImage({ url: report.fileData, type: 'pdf' })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold mt-1">PDF REPORT</span>
                          </div>
                        ) : report.fileData.startsWith('data:image') || report.fileData.includes('cloudinary.com') ? (
                          <img
                            src={report.fileData}
                            alt="Preview"
                            onClick={() => setSelectedImage({ url: report.fileData, type: 'image' })}
                            className="h-32 w-auto rounded-lg border border-[var(--border-color)] cursor-pointer hover:opacity-80 object-cover shadow-sm"
                          />
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
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