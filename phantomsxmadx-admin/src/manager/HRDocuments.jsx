import { useState, useEffect } from "react";
import { FiFileText, FiPlus, FiDownload, FiTrash2, FiSearch, FiEye, FiX, FiEdit2 } from "react-icons/fi";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useModal } from "../contexts/ModalContext";

export default function HRDocuments() {
  const { confirm } = useModal();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newDocument, setNewDocument] = useState({
    type: "appointment",
    userId: "",
    title: "",
    issuedDate: new Date().toISOString().split('T')[0],
    content: "",
    files: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docRes, empRes] = await Promise.all([
        api.get('/hr/documents'),
        api.get('/employees')
      ]);
      if (docRes.data.success) setDocuments(docRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error("Failed to fetch documents data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      Promise.all(selectedFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ name: file.name, data: reader.result, type: file.type });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })).then(fileDataArray => {
        setNewDocument(prev => ({ ...prev, files: [...prev.files, ...fileDataArray] }));
      });
    }
  };

  const removeFileFromNewDoc = (index) => {
    setNewDocument(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleEditDocument = (doc) => {
    setEditingId(doc._id);
    setNewDocument({
      type: doc.type,
      userId: doc.user?._id || doc.user,
      title: doc.title,
      issuedDate: new Date(doc.createdAt).toISOString().split('T')[0],
      content: doc.content || "",
      files: doc.files || []
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateDocument = async () => {
    if (!newDocument.userId || !newDocument.title) {
      toast.error("Please fill required fields (Employee, Title)");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/hr/documents/${editingId}`, newDocument);
      } else {
        const res = await api.post('/hr/documents', newDocument);
      }
      toast.success(editingId ? "Document updated successfully" : "Document created successfully");
      fetchData();
      cancelEdit();
    } catch (err) {
      console.error("Failed to save document", err);
      toast.error("Failed to save document");
    }
  };

  const handleDeleteDocument = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Document',
      cancelText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/hr/documents/${id}`);
        toast.success("Document deleted successfully");
        fetchData();
      } catch (err) {
        console.error("Failed to delete document", err);
        toast.error("Failed to delete document");
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    setNewDocument({
      type: "appointment",
      userId: "",
      title: "",
      issuedDate: new Date().toISOString().split('T')[0],
      content: "",
      files: []
    });
  };

  const filteredDocuments = documents.filter(doc =>
    (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const documentTypes = {
    appointment: { label: "Appointment Letter", color: "blue" },
    offer: { label: "Offer Letter", color: "green" },
    joining: { label: "Joining Letter", color: "purple" },
    relieving: { label: "Relieving Letter", color: "red" },
    experience: { label: "Experience Certificate", color: "orange" },
    salary: { label: "Salary Certificate", color: "yellow" },
    warning: { label: "Warning Letter", color: "red" }
  };

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary transition-colors">HR Documents</h1>
          <p className="text-sm text-theme-secondary transition-colors">Create and manage HR letters and certificates</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setNewDocument({
              type: "appointment",
              userId: "",
              title: "",
              issuedDate: new Date().toISOString().split('T')[0],
              content: "",
              files: []
            });
            setShowCreateForm(!showCreateForm);
          }}
          className="px-4 py-2 rounded-lg bg-[#004AAE] !text-white hover:bg-blue-600 flex items-center gap-2"
        >
          <FiPlus /> {showCreateForm ? "Close Form" : "Create Document"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '3rem' }}
          className="w-full pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE] transition-colors"
        />
        <FiSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>

      {/* CREATE/EDIT DOCUMENT FORM */}
      {showCreateForm && (
        <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-lg">
          <h3 className="font-semibold text-lg border-b border-[var(--border-color)] pb-2 text-theme-primary">
            {editingId ? "Edit Document" : "Create New Document"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Document Type *</label>
              <select
                value={newDocument.type}
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                className="w-full p-2 rounded-lg bg-theme-tertiary border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE]"
              >
                <option value="appointment">Appointment Letter</option>
                <option value="offer">Offer Letter</option>
                <option value="joining">Joining Letter</option>
                <option value="relieving">Relieving Letter</option>
                <option value="experience">Experience Certificate</option>
                <option value="salary">Salary Certificate</option>
                <option value="warning">Warning Letter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Employee *</label>
              <select
                value={newDocument.userId}
                onChange={(e) => setNewDocument({ ...newDocument, userId: e.target.value })}
                className="w-full p-2 rounded-lg bg-theme-tertiary border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE]"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp.userId?._id || emp.userId}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Title *</label>
              <input
                type="text"
                placeholder="Document title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                className="w-full p-2 rounded-lg bg-theme-tertiary border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Issued Date</label>
              <input
                type="date"
                value={newDocument.issuedDate}
                onChange={(e) => setNewDocument({ ...newDocument, issuedDate: e.target.value })}
                className="w-full p-2 rounded-lg bg-theme-tertiary border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Content</label>
              <textarea
                placeholder="Document content..."
                value={newDocument.content}
                onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                rows="4"
                className="w-full p-2 rounded-lg bg-theme-tertiary border border-[var(--border-color)] text-theme-primary focus:outline-none focus:ring-2 focus:ring-[#004AAE]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-theme-secondary">Upload Files (Multiple)</label>
              <input
                type="file"
                multiple
                className="w-full text-sm text-[var(--text-secondary)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                onChange={handleFileChange}
              />
              {newDocument.files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newDocument.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-sm border border-blue-500/20">
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button onClick={() => removeFileFromNewDoc(idx)} className="hover:text-red-500 p-1 rounded-full hover:bg-red-500/10"><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdateDocument}
              className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition font-semibold shadow"
            >
              {editingId ? "Update Document" : "Create Document"}
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-6 text-center text-theme-secondary">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="col-span-full p-6 text-center text-theme-secondary">
            {documents.length === 0 ? "No documents created yet" : "No documents match your search"}
          </div>
        ) : (
          filteredDocuments.map(doc => {
            const docType = documentTypes[doc.type] || { label: doc.type, color: "gray" };

            return (
              <div
                key={doc._id}
                className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:shadow-md transition relative group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-[#004AAE]/20 text-[#004AAE]">
                      <FiFileText size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-theme-primary">{doc.title}</h4>
                      <p className="text-xs text-theme-secondary">
                        {docType.label} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditDocument(doc)}
                      className="p-2 hover:bg-blue-500/20 text-blue-500 rounded transition"
                      title="Edit Document"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                      title="Delete Document"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-theme-secondary mb-3 line-clamp-2">{doc.content}</p>
                <p className="text-xs text-theme-muted mb-4 items-center flex gap-1"><FiPlus size={10} /> For: <span className="font-medium text-theme-primary">{doc.user?.name || doc.user?.username || "Unknown"}</span></p>

                {/* ATTACHMENTS */}
                {doc.files && doc.files.length > 0 ? (
                  <div className="mt-3 border-t border-[var(--border-color)] pt-3 bg-theme-tertiary/30 rounded-lg p-2">
                    <p className="text-xs font-semibold mb-2 text-theme-secondary uppercase flex items-center gap-1">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {doc.files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-lg text-sm border border-[var(--border-color)] shadow-sm">
                          <span className="max-w-[100px] truncate text-xs text-theme-primary" title={file.name}>{file.name}</span>
                          <div className="flex ml-1 border-l border-gray-600 pl-2 gap-2">
                            <button
                              onClick={() => setDocumentPreview(file)}
                              className="hover:text-blue-400 text-theme-secondary"
                              title="View"
                            >
                              <FiEye size={14} />
                            </button>
                            <a
                              href={file.data}
                              download={file.name}
                              className="hover:text-green-400 text-theme-secondary"
                              title="Download"
                            >
                              <FiDownload size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>
            );
          })
        )}
      </div>

      {/* FILE PREVIEW MODAL */}
      {documentPreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setDocumentPreview(null)}
        >
          <div
            className="relative bg-[var(--bg-card)] p-2 rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 border-b border-[var(--border-color)] mb-2">
              <h3 className="font-semibold truncate text-theme-primary">{documentPreview.name}</h3>
              <button
                className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                onClick={() => setDocumentPreview(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/20 rounded-lg p-4">
              {documentPreview.data && documentPreview.data.startsWith('data:image') ? (
                <img src={documentPreview.data} alt="Preview" className="max-w-full max-h-full object-contain" />
              ) : documentPreview.data && (documentPreview.data.startsWith('data:application/pdf') || documentPreview.data.toLowerCase().endsWith('.pdf') || documentPreview.type === 'application/pdf') ? (
                (() => {
                  let pdfUrl = documentPreview.data;
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
                  return (
                    <div className="w-full h-full min-h-[60vh] bg-white rounded-lg overflow-hidden relative flex flex-col border-2 border-gray-100">
                      <div className="p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2 pl-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Document PDF</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="px-3 py-1 bg-[#004AAE] text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition flex items-center gap-1 shadow-sm"
                          >
                            <FiEye size={12} /> Full Screen / Fix Blank
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 relative">
                        <iframe
                          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                          className="w-full h-full border-0 bg-white"
                          title="PDF Preview"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-20">
                  <FiFileText size={64} className="mx-auto mb-4 opacity-50 text-theme-secondary" />
                  <p className="mb-4 text-lg text-theme-primary">Preview not available for this file type.</p>
                  <a
                    href={documentPreview.data}
                    download={documentPreview.name}
                    className="px-6 py-3 bg-[#004AAE] !text-white rounded-lg hover:bg-blue-600 font-medium inline-flex items-center gap-2"
                  >
                    <FiDownload /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
