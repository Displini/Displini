import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChatButton() {
  const navigate = useNavigate();
  
  const handleChatClick = () => {
    // Navigate to contact page
    navigate('/contact');
  };

  return (
    <button 
      className="fixed bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-[9999]"
      style={{ 
        bottom: '24px',
        left: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
      }}
      onClick={handleChatClick}
      aria-label="Open chat"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}

