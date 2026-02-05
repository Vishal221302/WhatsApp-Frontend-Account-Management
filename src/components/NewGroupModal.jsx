import React, { useState, useEffect } from 'react';
import { getContacts, createGroup } from '../services/api';
import { FaTimes, FaSearch, FaUserCircle, FaCheck, FaArrowRight } from 'react-icons/fa';

const NewGroupModal = ({ sessionId, onClose }) => {
    const [step, setStep] = useState(1); // 1: Select Contacts, 2: Subject
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [subject, setSubject] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const { data } = await getContacts(sessionId);
            setContacts(data);
        } catch (e) {
            console.error("Failed to load contacts", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleContact = (contact) => {
        if (selectedContacts.find(c => c.id === contact.id)) {
            setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts(prev => [...prev, contact]);
        }
    };

    const handleCreate = async () => {
        if (!subject.trim()) return alert("Enter group subject");
        if (selectedContacts.length === 0) return alert("Select at least one participant");

        setCreating(true);
        try {
            const participants = selectedContacts.map(c => c.id);
            await createGroup(sessionId, subject, participants);
            onClose();
            alert("Group created successfully! Refreshing chats...");
        } catch (e) {
            console.error("Create group failed", e);
            alert("Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        (c.name || c.pushname || c.number).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/20" onClick={onClose}>
            <div className="w-[400px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-left" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#008069] p-4 flex items-center gap-4 text-white">
                    <button onClick={() => step === 1 ? onClose() : setStep(1)}>
                        <FaArrowRight className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold">{step === 1 ? 'Add group participants' : 'New group'}</h2>
                        {step === 1 && <p className="text-xs opacity-80">{selectedContacts.length} selected</p>}
                    </div>
                </div>

                {step === 1 ? (
                    <>
                        <div className="p-2 bg-white border-b">
                            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                                <FaSearch className="text-gray-500" />
                                <input
                                    className="w-full bg-transparent p-2 outline-none text-sm"
                                    placeholder="Type contact name"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Selected Chips */}
                        {selectedContacts.length > 0 && (
                            <div className="flex gap-2 p-2 overflow-x-auto border-b">
                                {selectedContacts.map(c => (
                                    <div key={c.id} className="flex flex-col items-center min-w-[60px]">
                                        <div className="relative">
                                            <FaUserCircle className="size-10 text-gray-300" />
                                            <button onClick={() => toggleContact(c)} className="absolute -bottom-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 text-xs"><FaTimes /></button>
                                        </div>
                                        <span className="text-xs truncate w-full text-center">{c.name || c.pushname}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {loading ? <div className="p-4 text-center">Loading contacts...</div> : (
                                filteredContacts.map(c => {
                                    const isSelected = selectedContacts.some(sc => sc.id === c.id);
                                    return (
                                        <div key={c.id} onClick={() => toggleContact(c)} className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer">
                                            <div className="relative">
                                                <FaUserCircle className="size-10 text-gray-300" />
                                                {isSelected && <div className="absolute bottom-0 right-0 bg-[#008069] text-white rounded-full p-0.5"><FaCheck size={10} /></div>}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{c.name || c.pushname || c.number}</h3>
                                                <p className="text-xs text-gray-500">~{c.pushname || c.number}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedContacts.length > 0 && (
                            <div className="p-4 bg-gray-50 flex justify-center">
                                <button onClick={() => setStep(2)} className="bg-[#008069] text-white p-3 rounded-full shadow-lg hover:bg-[#006a57]">
                                    <FaArrowRight />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col bg-gray-50">
                        <div className="bg-white p-8 flex flex-col items-center">
                            <div className="bg-gray-200 p-4 rounded-full mb-4">
                                <FaSearch className="size-8 text-gray-400" />
                            </div>
                            <input
                                className="w-full border-b-2 border-[#008069] text-center text-lg p-2 outline-none bg-transparent"
                                placeholder="Group Subject"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                maxLength={25}
                            />
                            <p className="text-xs text-gray-500 mt-2">Max 25 chars</p>
                        </div>
                        <div className="p-4">
                            <h3 className="text-xs font-bold text-gray-500 mb-2">PARTICIPANTS: {selectedContacts.length}</h3>
                            <div className="bg-white rounded shadow-sm">
                                {selectedContacts.map(c => (
                                    <div key={c.id} className="p-2 border-b last:border-0 flex items-center gap-2">
                                        <FaUserCircle className="text-gray-300" />
                                        <span className="text-sm">{c.name || c.pushname}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 flex items-end justify-center p-6">
                            <button onClick={handleCreate} disabled={creating} className="bg-[#008069] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-[#006a57] disabled:opacity-50">
                                {creating ? '...' : <FaCheck />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewGroupModal;
