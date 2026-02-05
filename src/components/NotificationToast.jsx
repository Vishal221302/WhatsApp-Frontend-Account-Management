import { useEffect } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';

const NotificationToast = ({ notification, onClose, onClick }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto close after 5 seconds

        return () => clearTimeout(timer);
    }, [notification, onClose]);

    if (!notification) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[100] animate-slide-in-right cursor-pointer"
            onClick={onClick}
        >
            <div className="bg-white rounded-lg shadow-xl border-l-4 border-[#25D366] p-4 flex items-start gap-3 w-80 max-w-full">
                <div className="bg-[#25D366] p-2 rounded-full text-white shrink-0">
                    <FaWhatsapp size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{notification.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{notification.body}</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;
