import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiUser, FiZap, FiLayers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HierarchyGraph() {
    const [ramshaAdmin, setRamshaAdmin] = useState(null);
    const [wajeehaAdmin, setWajeehaAdmin] = useState(null);
    const [awaisAdmin, setAwaisAdmin] = useState(null);
    const [hamzaAdmin, setHamzaAdmin] = useState(null);
    const [jointLeads, setJointLeads] = useState([]);
    const [staffCount, setStaffCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLight, setIsLight] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsLight(document.body.classList.contains('light'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        setIsLight(document.body.classList.contains('light'));

        const fetchHierarchy = async () => {
            try {
                const [empRes, adminRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/auth/admins')
                ]);
                
                const rawEmps = empRes.data?.employees || empRes.data?.data || [];
                const rawAdmins = adminRes.data?.admins || [];

                const seenIds = new Set();
                const cleanData = (list) => {
                    return list.filter(e => {
                        const id = String(e._id || e.userId?._id || e.id || '');
                        const role = (e.userId?.role || e.role || "").toLowerCase();
                        const dept = (e.department || "").toLowerCase();
                        const pos = (e.position || "").toLowerCase();
                        const status = (e.status || "active").toLowerCase();
                        const empName = (e.name || e.username || "").toLowerCase();
                        
                        if (!id || seenIds.has(id)) return false;
                        if (status !== 'active' && status !== '') return false;
                        
                        // Strictly remove HR and IT Support accounts as requested by user
                        if (role.includes('it support') || dept.includes('it support') || pos.includes('it-support') || empName.includes('it support')) return false;
                        if (role === 'hr' || pos === 'hr' || dept.includes('hr') || empName === 'hr' || empName.includes('hr hattech') || /\bhr\b/i.test(empName) || empName.includes('soa w')) return false;
                        
                        seenIds.add(id);
                        return true;
                    });
                };

                const allAdmins = cleanData(rawAdmins);
                const emps = cleanData(rawEmps);
                
                const getEmpId = (emp) => String(emp?._id || emp?.id || emp?.userId?._id || emp?.userId || '');
                const getUserId = (emp) => String(emp?.userId?._id || emp?.userId || emp?._id || emp?.id || '');
                const getParentId = (emp, parentType) => String(emp[parentType]?._id || emp[parentType] || '');

                // 1. Remove System Admin and keep only the 4 Main Admins
                const filteredAdmins = allAdmins.filter(a => {
                    const aName = (a.name || a.username || '').toLowerCase();
                    return !aName.includes('system admin');
                });

                // Load custom role titles edited in Admin Management (localStorage admin_custom_roles)
                let customRoles = {};
                try {
                    customRoles = JSON.parse(localStorage.getItem('admin_custom_roles') || '{}');
                } catch (e) {}

                const getAdminTitle = (adm) => {
                    if (!adm) return 'Admin';
                    const aId = getUserId(adm);
                    const email = (adm.email || '').toLowerCase().trim();
                    const name = (adm.name || adm.username || '').toLowerCase().trim();

                    return customRoles[aId] || 
                           customRoles[adm._id] || 
                           customRoles[adm.id] || 
                           (email && customRoles[email]) || 
                           (name && customRoles[name]) || 
                           adm.roleTitle || 
                           adm.designation || 
                           adm.position || 
                           'Admin';
                };

                const makeAdminNode = (adm, defaultName, defaultRole) => ({
                    id: adm ? String(adm._id || adm.id || getUserId(adm)) : `admin-${defaultName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: adm?.name || defaultName,
                    role: adm ? getAdminTitle(adm) : defaultRole,
                    avatar: adm?.avatar || adm?.userId?.avatar,
                    isAdmin: true,
                    children: []
                });

                const findAdmin = (key) => filteredAdmins.find(a => (a.name || a.username || '').toLowerCase().includes(key));

                const ramshaNode = makeAdminNode(findAdmin('ramsha'), 'Ramsha Rashid', 'Co-Founder');
                const awaisNode = makeAdminNode(findAdmin('awais') || findAdmin('rana'), 'Rana Awais', 'Co-Founder & CTO');
                const hamzaNode = makeAdminNode(findAdmin('hamza'), 'Muhammad Hamza Ali', 'Founder & CEO');
                const wajeehaNode = makeAdminNode(findAdmin('wajeeha'), 'Wajeeha Amin', 'Head of Digital Growth');

                // All Staff Node under HR
                const allStaffNode = {
                    id: 'all-staff-node',
                    name: 'All Staff',
                    role: 'Company Personnel',
                    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=4F46E5&textColor=ffffff',
                    isMember: true,
                    children: []
                };

                // HR Node under Ramsha Rashid
                const hrNode = {
                    id: 'dept-hr',
                    name: 'HR Department',
                    role: 'Talent & Operations',
                    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=HR&backgroundColor=004AAE&textColor=ffffff',
                    children: [allStaffNode]
                };
                ramshaNode.children.push(hrNode);

                // 2. Identify the key Team Leads
                const findEmp = (keyword) => emps.find(e => (e.name || e.username || '').toLowerCase().includes(keyword.toLowerCase()));

                const talhaEmp = findEmp('talha');
                const umerEmp = findEmp('umer') || findEmp('hannan');
                const salmanEmp = findEmp('salman');
                const farrukhEmp = findEmp('farrukh');
                const aliMusaEmp = findEmp('ali musa') || emps.find(e => (e.name || '').toLowerCase().includes('ali') && (e.name || '').toLowerCase().includes('musa'));

                const createLeadNode = (emp, defaultName, defaultRole, fallbackAvatar = null) => ({
                    id: emp ? getEmpId(emp) : `lead-${defaultName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: emp?.name || defaultName,
                    role: emp?.position || emp?.jobTitle || emp?.role || defaultRole,
                    avatar: emp?.profileImage || emp?.image || emp?.avatar || emp?.userId?.avatar || emp?.userId?.image || fallbackAvatar,
                    children: []
                });

                const talhaNode = createLeadNode(
                    talhaEmp, 
                    'Talha Qasim', 
                    'SEO Expert / Team Lead', 
                    'https://api.dicebear.com/7.x/initials/svg?seed=TQ&backgroundColor=004AAE&textColor=ffffff'
                );
                const umerNode = createLeadNode(umerEmp, 'Umer Hannan', 'Video Editor / Media');
                const salmanNode = createLeadNode(salmanEmp, 'Muhammad Salman', 'MERN & PHP Stack Web Dev');
                const farrukhNode = createLeadNode(farrukhEmp, 'Farrukh Saleem', 'PHP Web Developer');
                const aliMusaNode = createLeadNode(aliMusaEmp, 'Ali Musa', 'AI / ML Engineer');

                // 3. Link Leads under Wajeeha Amin: Talha Qasim & Umer Hannan
                wajeehaNode.children = [talhaNode, umerNode].filter(Boolean);

                // 4. Link Leads under Rana Awais: Muhammad Salman and Farrukh Saleem
                awaisNode.children = [salmanNode, farrukhNode].filter(Boolean);

                // 5. Link Leads under Muhammad Hamza Ali: Ali Musa (AI / ML)
                hamzaNode.children = [aliMusaNode].filter(Boolean);

                // 6. Map Members to their specific Team Leads
                const allLeadEmps = [talhaEmp, umerEmp, salmanEmp, farrukhEmp, aliMusaEmp].filter(Boolean);
                const leadEmpIds = new Set(allLeadEmps.map(e => getEmpId(e)));
                const remainingEmps = emps.filter(e => !leadEmpIds.has(getEmpId(e)));

                remainingEmps.forEach(m => {
                    const mName = String(m.name || m.username || '').toLowerCase();
                    const tlId = getParentId(m, 'teamLead');
                    const phId = getParentId(m, 'projectHead');
                    const tlRaw = typeof m.teamLead === 'object' ? (m.teamLead?.name || m.teamLead?.username || '') : (m.teamLead || '');
                    const tlName = String(tlRaw || '').toLowerCase();
                    const phRaw = typeof m.projectHead === 'object' ? (m.projectHead?.name || m.projectHead?.username || '') : (m.projectHead || '');
                    const phName = String(phRaw || '').toLowerCase();
                    const dept = (m.department || '').toLowerCase();

                    const mNode = {
                        id: getEmpId(m),
                        name: m.name,
                        role: m.position || m.jobTitle || m.role || 'Member',
                        avatar: m.profileImage || m.image || m.avatar || m.userId?.avatar || m.userId?.image,
                        isMember: true,
                        children: []
                    };

                    // 1. Check Talha's SEO Team (Talha Qasim under Wajeeha)
                    if (
                        (talhaEmp && (tlId === getUserId(talhaEmp) || tlId === getEmpId(talhaEmp))) ||
                        tlName.includes('talha') ||
                        mName.includes('tehreem') ||
                        mName.includes('muneeb') ||
                        mName.includes('ameer haider') ||
                        mName.includes('meesam') ||
                        mName.includes('ahmad') ||
                        dept === 'seo' ||
                        dept.includes('seo')
                    ) {
                        talhaNode.children.push(mNode);
                        return;
                    }

                    // 2. Check Umer's Media Team (Umer Hannan under Wajeeha)
                    if (
                        (umerEmp && (tlId === getUserId(umerEmp) || tlId === getEmpId(umerEmp))) ||
                        tlName.includes('umer') ||
                        tlName.includes('hannan') ||
                        mName.includes('dilshad') ||
                        mName.includes('subhan') ||
                        dept.includes('graphic') ||
                        dept.includes('media') ||
                        dept.includes('video')
                    ) {
                        umerNode.children.push(mNode);
                        return;
                    }

                    // 3. Check Farrukh's PHP Team (Farrukh Saleem under Rana Awais)
                    if (
                        (farrukhEmp && (tlId === getUserId(farrukhEmp) || tlId === getEmpId(farrukhEmp))) ||
                        tlName.includes('farrukh') ||
                        mName.includes('urwa')
                    ) {
                        farrukhNode.children.push(mNode);
                        return;
                    }

                    // 4. Check Salman's MERN Team (Muhammad Salman under Rana Awais)
                    if (
                        (salmanEmp && (tlId === getUserId(salmanEmp) || tlId === getEmpId(salmanEmp))) ||
                        tlName.includes('salman') ||
                        mName.includes('huzaifa') ||
                        mName.includes('malaika') ||
                        mName.includes('emaad') ||
                        mName.includes('abdullah') ||
                        dept.includes('web development') ||
                        dept.includes('development')
                    ) {
                        salmanNode.children.push(mNode);
                        return;
                    }

                    // 5. Check Ali Musa's AI / ML Team (Ali Musa under Hamza)
                    if (
                        (aliMusaEmp && (tlId === getUserId(aliMusaEmp) || tlId === getEmpId(aliMusaEmp))) ||
                        tlName.includes('ali musa') ||
                        tlName.includes('musa') ||
                        mName.includes('shahzaib') ||
                        mName.includes('nouman') ||
                        dept.includes('ai')
                    ) {
                        aliMusaNode.children.push(mNode);
                        return;
                    }

                    // 6. HR team
                    if (mName.includes('hr') || dept.includes('hr')) {
                        hrNode.children.push(mNode);
                        return;
                    }

                    // Fallback to Salman's team only if completely unmatched
                    salmanNode.children.push(mNode);
                });

                // Set states
                setRamshaAdmin(ramshaNode);
                setWajeehaAdmin(wajeehaNode);
                setAwaisAdmin(awaisNode);
                setHamzaAdmin(hamzaNode);
                setJointLeads([talhaNode, umerNode, salmanNode, farrukhNode, aliMusaNode]);

                // Calculate total unique active staff shown in hierarchy
                const countMembers = (node) => {
                    let total = 1;
                    if (node?.children) {
                        node.children.forEach(c => {
                            total += countMembers(c);
                        });
                    }
                    return total;
                };

                const totalStaff = countMembers(ramshaNode) + countMembers(wajeehaNode) + countMembers(awaisNode) + countMembers(hamzaNode);
                setStaffCount(totalStaff);
            } catch (err) {
                console.error("Hierarchy error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHierarchy();
        return () => observer.disconnect();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className={`min-h-screen space-y-8 pb-32 overflow-x-hidden ${isLight ? 'bg-[#f4f6fa]' : 'bg-[#0a0a0f]'}`}>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br from-[#004AAE] via-[#003882] to-[#002A66] shadow-2xl mx-4"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-3">
                            <FiLayers className="text-blue-300" /> Organizational Graph
                        </h1>
                        <p className="text-blue-100/70 font-bold tracking-[0.2em] uppercase text-[10px]">
                            Hat Tech Media • Executive Leadership & Team Structure ({staffCount} Members)
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Scrollable Container for Mobile & Desktop */}
            <div className="w-full py-10 px-4 overflow-x-auto overflow-y-visible custom-hierarchy-scroll flex lg:justify-center">
                <div className="inline-block text-center origin-top scale-[0.85] lg:scale-100 min-w-max px-10">
                    {/* LEADERSHIP ROW: WAJEEHA AMIN | RANA AWAIS | MUHAMMAD HAMZA ALI | RAMSHA RASHID */}
                    <div className="relative flex justify-center gap-10 lg:gap-14 pt-0 items-start">
                        {/* Horizontal connector bar across the 4 Leaders */}
                        <div 
                            className="absolute top-6 h-[3px] bg-[#004AAE] opacity-70"
                            style={{ left: '90px', right: '90px', width: 'auto' }}
                        />

                        {/* 1. WAJEEHA AMIN COLUMN (Digital Growth, SEO & Media) */}
                        <div className="relative flex flex-col items-center">
                            <TreeNodeCard node={wajeehaAdmin} isRoot isLight={isLight} navigate={navigate} />
                            <div className="w-[3px] h-8 bg-[#004AAE] opacity-70" />

                            {/* Sub-branches for Tehreem and Umer */}
                            <div className="relative flex gap-8 justify-center items-start">
                                {wajeehaAdmin?.children?.length > 1 && (
                                    <div 
                                        className="absolute top-0 h-[3px] bg-[#004AAE] opacity-70"
                                        style={{ left: '80px', right: '80px', width: 'auto' }}
                                    />
                                )}
                                {wajeehaAdmin?.children?.map((child) => (
                                    <div key={child.id} className="relative flex flex-col items-center">
                                        <div className="w-[3px] h-6 bg-[#004AAE] opacity-70 mb-1" />
                                        <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. RANA AWAIS COLUMN (Web Development - Salman & Farrukh) */}
                        <div className="relative flex flex-col items-center">
                            <TreeNodeCard node={awaisAdmin} isRoot isLight={isLight} navigate={navigate} />
                            <div className="w-[3px] h-8 bg-[#004AAE] opacity-70" />
                            
                            {/* Sub-branches for Salman and Farrukh */}
                            <div className="relative flex gap-8 justify-center items-start">
                                {awaisAdmin?.children?.length > 1 && (
                                    <div 
                                        className="absolute top-0 h-[3px] bg-[#004AAE] opacity-70"
                                        style={{ left: '80px', right: '80px', width: 'auto' }}
                                    />
                                )}
                                {awaisAdmin?.children?.map((child) => (
                                    <div key={child.id} className="relative flex flex-col items-center">
                                        <div className="w-[3px] h-6 bg-[#004AAE] opacity-70 mb-1" />
                                        <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. MUHAMMAD HAMZA ALI COLUMN (AI & Innovation - Ali Musa) */}
                        <div className="relative flex flex-col items-center">
                            <TreeNodeCard node={hamzaAdmin} isRoot isLight={isLight} navigate={navigate} />
                            <div className="w-[3px] h-8 bg-[#004AAE] opacity-70" />

                            {/* Sub-branch for Ali Musa */}
                            <div className="relative flex gap-8 justify-center items-start">
                                {hamzaAdmin?.children?.length > 1 && (
                                    <div 
                                        className="absolute top-0 h-[3px] bg-[#004AAE] opacity-70"
                                        style={{ left: '80px', right: '80px', width: 'auto' }}
                                    />
                                )}
                                {hamzaAdmin?.children?.map((child) => (
                                    <div key={child.id} className="relative flex flex-col items-center">
                                        <div className="w-[3px] h-6 bg-[#004AAE] opacity-70 mb-1" />
                                        <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. RAMSHA RASHID COLUMN (HR & Talent - Last position) */}
                        <div className="relative flex flex-col items-center">
                            <TreeNodeCard node={ramshaAdmin} isRoot isLight={isLight} navigate={navigate} />
                            <div className="w-[3px] h-8 bg-[#004AAE] opacity-70" />
                            <TreeNode node={ramshaAdmin?.children?.[0]} isLight={isLight} navigate={navigate} />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .tree-connector-v { width: 3px; background: #004AAE; opacity: 0.8; margin: 0 auto; }
                .tree-connector-h { height: 3px; background: #004AAE; opacity: 0.6; position: absolute; top: 0; }
                
                /* Custom Hierarchy Scrollbar */
                .custom-hierarchy-scroll::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-hierarchy-scroll::-webkit-scrollbar-track {
                    background: ${isLight ? '#f4f6fa' : '#0a0a0f'};
                }
                .custom-hierarchy-scroll::-webkit-scrollbar-thumb {
                    background: #004AAE60;
                    border-radius: 10px;
                }
                .custom-hierarchy-scroll::-webkit-scrollbar-thumb:hover {
                    background: #004AAE;
                }

                @media (max-width: 1024px) {
                    .tree-node-card { min-w-[125px] !important; max-w-[145px] !important; }
                }
            `}</style>
        </div>
    );
}

function handleNodeClick(node, navigate) {
    if (!node || !node.id) return;
    if (node.id === 'dept-hr' || node.id === 'all-staff-node') {
        navigate('/admin/employees');
        return;
    }
    if (node.id.startsWith('admin-')) {
        return; // Executive leadership node
    }
    // Check if valid mongo id
    if (/^[0-9a-fA-F]{24}$/.test(node.id)) {
        navigate(`/admin/employee/${node.id}`);
    } else {
        navigate('/admin/employees');
    }
}

function TreeNodeCard({ node, isRoot, isLight, navigate }) {
    if (!node) return null;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2, scale: 1.02 }}
            onClick={() => handleNodeClick(node, navigate)}
            className={`
                relative group z-20 p-2.5 rounded-[1.1rem] transition-all duration-300 min-w-[140px] max-w-[180px] tree-node-card
                ${isRoot 
                    ? 'bg-gradient-to-br from-[#004AAE] to-[#002A66] shadow-xl text-white' 
                    : isLight 
                        ? 'bg-white text-gray-900 shadow-md border border-gray-100' 
                        : 'bg-[#151235] text-white shadow-xl border border-white/5'
                }
                ${node.id ? 'cursor-pointer' : ''}
            `}
        >
            <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                    {node.avatar ? (
                        <img src={node.avatar} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5 shadow-md tree-node-avatar" alt="" />
                    ) : (
                        <div className={`w-8 h-8 rounded-lg ${isRoot ? 'bg-white/10' : 'bg-[#004AAE]/10'} flex items-center justify-center text-sm shadow-md tree-node-avatar`}>
                            {node.icon || <FiUser className={isRoot ? 'text-white' : 'text-[#004AAE]'} />}
                        </div>
                    )}
                </div>
                <div className="text-left overflow-hidden">
                    <h4 className={`text-[9px] font-black uppercase truncate tree-node-name ${isRoot ? 'text-white' : isLight ? 'text-gray-900' : 'text-white'}`}>{node.name}</h4>
                    <p className={`text-[7px] font-black uppercase tracking-wider mt-0.5 truncate tree-node-role ${isRoot ? 'text-blue-300' : isLight ? 'text-indigo-600' : 'text-blue-400'}`}>{node.role}</p>
                </div>
            </div>
        </motion.div>
    );
}

function TreeNode({ node, isRoot, isLight, navigate }) {
    if (!node) return null;
    const [expanded, setExpanded] = useState(true);
    const containerRef = useRef(null);
    const members = node.children?.filter(c => c.isMember) || [];
    const others = node.children?.filter(c => !c.isMember) || [];
    const hasChildren = members.length > 0 || others.length > 0;

    if (node.isSpacer) {
        return (
            <div className="flex flex-col items-center">
                <div className="px-3 py-1 rounded-full bg-[#004AAE20] mb-2">
                    <p className="text-[6px] font-black uppercase tracking-widest text-[#004AAE]">{node.name}</p>
                </div>
                {hasChildren && (
                    <div className="flex flex-col items-center w-full relative">
                        {/* Vertical line down */}
                        <div className="w-[3px] h-6 bg-[#004AAE] opacity-40"></div>
                        
                        {/* Horizontal connector bar for siblings */}
                        {node.children.length > 1 && (
                            <div 
                                className="absolute top-[24px] h-[3px] bg-[#004AAE] opacity-40" 
                                style={{ 
                                    left: 'calc(140px / 2)', 
                                    right: 'calc(140px / 2)',
                                    width: 'auto'
                                }}
                            ></div>
                        )}

                        <div className="flex gap-4 pt-0 justify-center">
                            {node.children.map((child, idx) => (
                                <div key={child.id || idx} className="relative flex flex-col items-center">
                                    <div className="w-[3px] h-6 bg-[#004AAE] opacity-40"></div>
                                    <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center mx-2" ref={containerRef}>
            {/* The Node Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2, scale: 1.02 }}
                onClick={() => handleNodeClick(node, navigate)}
                className={`
                    relative group z-20 p-2.5 rounded-[1.1rem] transition-all duration-300 min-w-[140px] max-w-[180px] tree-node-card
                    ${isRoot 
                        ? 'bg-gradient-to-br from-[#004AAE] to-[#002A66] shadow-xl text-white' 
                        : isLight 
                            ? 'bg-white text-gray-900 shadow-md border border-gray-100' 
                            : 'bg-[#151235] text-white shadow-xl border border-white/5'
                    }
                    ${node.id !== 'root' ? 'cursor-pointer' : ''}
                `}
            >
                <div className="flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                        {node.avatar ? (
                            <img src={node.avatar} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/5 shadow-md tree-node-avatar" alt="" />
                        ) : (
                            <div className={`w-8 h-8 rounded-lg ${isRoot ? 'bg-white/10' : 'bg-[#004AAE]/10'} flex items-center justify-center text-sm shadow-md tree-node-avatar`}>
                                {node.icon || <FiUser className={isRoot ? 'text-white' : 'text-[#004AAE]'} />}
                            </div>
                        )}
                    </div>
                    <div className="text-left overflow-hidden">
                        <h4 className={`text-[9px] font-black uppercase truncate tree-node-name ${isRoot ? 'text-white' : isLight ? 'text-gray-900' : 'text-white'}`}>{node.name}</h4>
                        <p className={`text-[7px] font-black uppercase tracking-wider mt-0.5 truncate tree-node-role ${isRoot ? 'text-blue-300' : isLight ? 'text-indigo-600' : 'text-blue-400'}`}>{node.role}</p>
                    </div>
                </div>

                {hasChildren && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-lg bg-[#004AAE] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all z-30"
                    >
                        <FiChevronRight className={`transition-transform duration-500 ${expanded ? 'rotate-90' : ''}`} size={10} />
                    </button>
                )}
            </motion.div>

            {/* Connectors & Children */}
            <AnimatePresence>
                {hasChildren && expanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col items-center w-full relative"
                    >
                        {/* Line from parent to children groups */}
                        {(others.length > 0 || members.length > 0) && (
                            <div className="w-[3px] h-8 bg-[#004AAE] opacity-60"></div>
                        )}

                        {others.length > 0 && members.length > 0 ? (
                            <div className="flex gap-12 justify-center relative items-start">
                                {/* Horizontal connector bar */}
                                <div 
                                    className="absolute top-0 h-[3px] bg-[#004AAE] opacity-60" 
                                    style={{ 
                                        left: '40px', 
                                        right: '40px',
                                        width: 'auto'
                                    }}
                                ></div>

                                {/* MEMBERS (Direct Connection) */}
                                <div className="relative flex flex-col items-center">
                                    <div className="w-[3px] h-8 bg-[#004AAE] opacity-40"></div>
                                    <div className="space-y-3">
                                        <p className={`text-[6px] font-black uppercase tracking-widest ${isLight ? 'text-indigo-600' : 'text-blue-400'} opacity-75 mb-1 text-center`}>Direct Reports</p>
                                        {members.map((member, idx) => (
                                            <div 
                                                key={member.id || idx}
                                                onClick={() => handleNodeClick(member, navigate)}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all min-w-[150px] border border-transparent hover:border-indigo-500/20 group hover:scale-105 active:scale-95 ${isLight ? 'bg-white shadow-md border border-gray-155' : 'bg-[#151235]/50'} shadow-lg`}
                                            >
                                                <img src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/20" alt="" />
                                                <div className="text-left overflow-hidden">
                                                    <p className={`text-[9px] font-black uppercase truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{member.name}</p>
                                                    <p className={`text-[7px] ${isLight ? 'text-indigo-600' : 'text-blue-400'} uppercase tracking-tighter truncate font-black`}>{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* OTHERS (TLs, PHs) */}
                                {others.map((child, idx) => (
                                    <div key={child.id || idx} className="relative flex flex-col items-center">
                                        <div className="w-[3px] h-8 bg-[#004AAE] opacity-40"></div>
                                        <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Simple centered layout if only one type of children */
                            <div className="flex flex-col items-center w-full">
                                {others.length > 0 && (
                                    <div className="flex gap-6 justify-center relative">
                                        {others.length > 1 && (
                                            <div 
                                                className="absolute top-0 h-[3px] bg-[#004AAE] opacity-60" 
                                                style={{ left: '70px', right: '70px', width: 'auto' }}
                                            ></div>
                                        )}
                                        {others.map((child, idx) => (
                                            <div key={child.id || idx} className="relative flex flex-col items-center">
                                                <div className="w-[3px] h-8 bg-[#004AAE] opacity-40"></div>
                                                <TreeNode node={child} isLight={isLight} navigate={navigate} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {members.length > 0 && (
                                    <div className="flex flex-col items-center space-y-2">
                                        {members.map((member, idx) => (
                                            <div key={member.id || idx} className="flex flex-col items-center">
                                                <div className="w-[2px] h-3 bg-[#004AAE] opacity-20"></div>
                                                <div 
                                                    onClick={() => handleNodeClick(member, navigate)}
                                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all min-w-[140px] border border-transparent hover:border-indigo-500/20 ${isLight ? 'bg-white shadow-sm border border-gray-100' : 'bg-[#151235]/50'}`}
                                                >
                                                    <img src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} className="w-6 h-6 rounded object-cover" alt="" />
                                                    <div className="text-left overflow-hidden">
                                                        <p className={`text-[8px] font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{member.name}</p>
                                                        <p className={`text-[6px] ${isLight ? 'text-indigo-600' : 'text-blue-400'} uppercase tracking-tighter truncate font-bold`}>{member.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
