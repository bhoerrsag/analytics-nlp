'use client';

import { marked } from 'marked';
import { useEffect, useState } from 'react';

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Configure marked for safe HTML output
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Parse markdown to HTML
    const parsed = marked(content);
    setHtmlContent(parsed);
  }, [content]);

  return (
    <div 
      className="prose prose-sm max-w-none
        prose-headings:text-black prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
        prose-p:text-black prose-p:leading-relaxed prose-p:mb-3
        prose-strong:text-black prose-strong:font-semibold
        prose-ul:space-y-1 prose-li:text-black prose-li:text-sm
        prose-ol:space-y-1 
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-pre:overflow-x-auto
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
        prose-table:text-xs prose-table:border-collapse
        prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-2 prose-th:py-1 prose-th:font-semibold
        prose-td:border prose-td:border-gray-300 prose-td:px-2 prose-td:py-1
      "
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}