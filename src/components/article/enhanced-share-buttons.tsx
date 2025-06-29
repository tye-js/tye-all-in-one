'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Share2, 
  Copy, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Check,
  Mail,
  MessageSquare,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  hashtags?: string[];
}

export default function EnhancedShareButtons({ 
  title, 
  description, 
  url,
  hashtags = []
}: EnhancedShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = description || title;
  const hashtagString = hashtags.length > 0 ? hashtags.map(tag => `#${tag}`).join(' ') : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: currentUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${hashtagString}`)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(shareText)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\nRead more: ${currentUrl}`)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a 
            href={shareUrls.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Twitter className="w-4 h-4 mr-2" />
            Share on Twitter
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={shareUrls.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Share on Facebook
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={shareUrls.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            Share on LinkedIn
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={shareUrls.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={shareUrls.email}
            className="flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Share via Email
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
