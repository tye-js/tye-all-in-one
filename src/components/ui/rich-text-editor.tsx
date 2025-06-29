'use client';

import { useState, useCallback, useRef } from 'react';
import { Textarea } from './textarea';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent } from './card';
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Image,
  Eye,
  Edit3,
  Type
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '400px',
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((before: string, after: string = '', placeholderText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholderText;

    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertText('**', '**', 'bold text'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertText('*', '*', 'italic text'),
    },
    {
      icon: Code,
      label: 'Inline Code',
      action: () => insertText('`', '`', 'code'),
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertText('\n- ', '', 'list item'),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => insertText('\n1. ', '', 'list item'),
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertText('\n> ', '', 'quote'),
    },
    {
      icon: Image,
      label: 'Image',
      action: () => insertText('![', '](image-url)', 'alt text'),
    },
  ];

  const insertHeading = (level: number) => {
    const hashes = '#'.repeat(level);
    insertText(`\n${hashes} `, '', `Heading ${level}`);
  };

  const insertCodeBlock = () => {
    insertText('\n```javascript\n', '\n```\n', 'your code here');
  };

  return (
    <div className={`border rounded-lg ${className}`}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'write' | 'preview')}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="m-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
            {/* Headings */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(1)}
                title="Heading 1"
              >
                <Type className="w-4 h-4" />
                H1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(2)}
                title="Heading 2"
              >
                <Type className="w-4 h-4" />
                H2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(3)}
                title="Heading 3"
              >
                <Type className="w-4 h-4" />
                H3
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Text formatting */}
            {toolbarButtons.map((button) => {
              const Icon = button.icon;
              return (
                <Button
                  key={button.label}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Code block */}
            <Button
              variant="ghost"
              size="sm"
              onClick={insertCodeBlock}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
              Block
            </Button>
          </div>

          {/* Editor */}
          <div className="p-3">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[400px] border-0 resize-none focus-visible:ring-0 font-mono text-sm"
              style={{ minHeight }}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="p-6" style={{ minHeight }}>
            {value ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-bold mt-3 mb-2">{children}</h4>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 bg-blue-50 py-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={className}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
                        {children}
                      </pre>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: ({ src, alt }) => (
                      <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-4 py-2">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-500 italic">
                Nothing to preview yet. Start writing in the Write tab.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
