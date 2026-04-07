import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDetailsProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
}

export function ErrorDetails({ error, errorInfo }: ErrorDetailsProps) {
  const [copied, setCopied] = useState(false);

  const errorText = `${error.toString()}\n\n${errorInfo?.componentStack || ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy error:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <details className="mb-6 text-left">
      <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
        Error Details (Development Only)
      </summary>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-48 relative">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-6 px-2 text-gray-600 hover:text-gray-900"
          aria-label="Copy error details"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
        <p className="text-red-800 font-bold mb-2 pr-20">{error.toString()}</p>
        {errorInfo && (
          <pre className="text-red-700 whitespace-pre-wrap pr-20">
            {errorInfo.componentStack}
          </pre>
        )}
      </div>
    </details>
  );
}

