import { getChatInfo, groupAction, getChatMedia } from '../services/api';
import { FaUserCircle, FaTimes, FaCamera, FaUserPlus, FaTrash, FaUserShield, FaPencilAlt, FaCheck, FaPhone, FaVideo, FaSearch, FaChevronRight, FaStar, FaLock, FaSignOutAlt, FaBan, FaThumbsDown, FaArrowLeft, FaFileAlt, FaLink, FaImage } from 'react-icons/fa';

const MediaGallery = ({ sessionId, chat, onClose }) => {
    const [media, setMedia] = useState({ media: [], docs: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('media'); // media, docs, links

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const { data } = await getChatMedia(sessionId, chat.id);
                setMedia(data);
            } catch (e) {
                console.error("Failed to load media", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [sessionId, chat.id]);

    return (
        <div className="flex flex-col h-full bg-white animate-slide-in-right">
            <div className="bg-white p-3 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onClose}><FaArrowLeft className="text-gray-500" /></button>
                <div className="flex-1">
                    <h2 className="text-md font-medium text-gray-800">Media, Links, and Docs</h2>
                </div>
            </div>

            <div className="flex items-center justify-around border-b border-gray-200">
                <button onClick={() => setTab('media')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'media' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Media</button>
                <button onClick={() => setTab('docs')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'docs' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Docs</button>
                <button onClick={() => setTab('links')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'links' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Links</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? <div className="text-center p-4 text-gray-500">Loading...</div> : (
                    <>
                        {tab === 'media' && (
                            <div className="grid grid-cols-3 gap-1">
                                {media.media.map(m => (
                                    <div key={m.id} className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {/* Since we don't have thumbnails easily, show type icon or placeholder. 
                                            Ideally we'd fetch actual media blob or text content base64 if small. 
                                            For now, just a placeholder or icon. 
                                        */}
                                        <FaImage className="text-gray-300 text-3xl" />
                                        <span className="absolute bottom-1 right-1 text-[10px] text-gray-500">{new Date(m.timestamp * 1000).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                {media.media.length === 0 && <div className="col-span-3 text-center text-gray-500 mt-10">No media found</div>}
                            </div>
                        )}

                        {tab === 'docs' && (
                            <div className="flex flex-col">
                                {media.docs.map(d => (
                                    <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50">
                                        <FaFileAlt className="text-gray-400 text-xl" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{d.filename || 'Document'}</p>
                                            <p className="text-xs text-gray-500">{new Date(d.timestamp * 1000).toLocaleDateString()} • {d.mimetype}</p>
                                        </div>
                                    </div>
                                ))}
                                {media.docs.length === 0 && <div className="text-center text-gray-500 mt-10">No documents found</div>}
                            </div>
                        )}

                        {tab === 'links' && (
                            <div className="flex flex-col gap-2">
                                {media.links.map(l => (
                                    <div key={l.id} className="bg-gray-50 p-3 rounded-lg flex gap-3">
                                        <div className="bg-gray-200 p-2 rounded h-fit"><FaLink className="text-gray-500" /></div>
                                        <div className="flex-1 min-w-0">
                                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all font-medium block mb-1">{l.url}</a>
                                            <p className="text-xs text-gray-500 line-clamp-2">{l.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {media.links.length === 0 && <div className="text-center text-gray-500 mt-10">No links found</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
