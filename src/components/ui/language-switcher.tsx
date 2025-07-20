'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { useLanguageSwitcher } from '@/lib/i18n';
import { localeConfig, type Locale } from '@/lib/i18n/types';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'lg';
  showFlag?: boolean;
  showText?: boolean;
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  showFlag = true,
  showText = false,
  className = '',
}: LanguageSwitcherProps) {
  const { currentLocale, switchLanguage, availableLocales } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = localeConfig[currentLocale];

  const handleLanguageChange = (locale: Locale) => {
    switchLanguage(locale);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center space-x-2 ${className}`}
        >
          {showFlag && (
            <span className="text-lg">{currentConfig.flag}</span>
          )}
          {!showFlag && <Globe className="w-4 h-4" />}
          {showText && (
            <span className="hidden sm:inline">
              {currentConfig.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {availableLocales.map((locale) => {
          const config = localeConfig[locale];
          const isSelected = locale === currentLocale;
          
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{config.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{config.nativeName}</span>
                  <span className="text-xs text-gray-500">{config.name}</span>
                </div>
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 简化版语言切换器（只显示图标）
export function LanguageSwitcherCompact({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="ghost"
      size="sm"
      showFlag={false}
      showText={false}
      className={className}
    />
  );
}

// 完整版语言切换器（显示标志和文本）
export function LanguageSwitcherFull({ className = '' }: { className?: string }) {
  return (
    <LanguageSwitcher
      variant="outline"
      size="lg"
      showFlag={true}
      showText={true}
      className={className}
    />
  );
}
