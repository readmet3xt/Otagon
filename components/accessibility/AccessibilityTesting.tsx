import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { testing, aria, screenReader } from '../../utils/accessibility';

// ===== ACCESSIBILITY AUDIT COMPONENT =====

interface AccessibilityAuditProps {
  element?: HTMLElement;
  className?: string;
}

const AccessibilityAudit: React.FC<AccessibilityAuditProps> = ({
  element,
  className
}) => {
  const [auditResults, setAuditResults] = useState<ReturnType<typeof testing.auditElement> | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (element) {
      const results = testing.auditElement(element);
      setAuditResults(results);
    }
  }, [element]);

  if (!auditResults) return null;

  const { hasAriaLabel, hasFocusManagement, hasAccessibleContrast, meetsTouchTarget, issues } = auditResults;

  return (
    <div className={cn('p-4 bg-[#1C1C1C] border border-[#424242] rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F5F5F5]">Accessibility Audit</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          {isVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-3">
          {/* Audit Results */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {hasAriaLabel ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-[#CFCFCF]">ARIA Label</span>
            </div>

            <div className="flex items-center gap-2">
              {hasFocusManagement ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-[#CFCFCF]">Focus Management</span>
            </div>

            <div className="flex items-center gap-2">
              {hasAccessibleContrast ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-[#CFCFCF]">Color Contrast</span>
            </div>

            <div className="flex items-center gap-2">
              {meetsTouchTarget ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-[#CFCFCF]">Touch Target</span>
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-[#CFCFCF] mb-2">Issues Found:</h4>
              <ul className="space-y-1">
                {issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-400">
                    <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {issues.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              All accessibility checks passed!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== COLOR CONTRAST TESTER =====

interface ColorContrastTesterProps {
  className?: string;
}

const ColorContrastTester: React.FC<ColorContrastTesterProps> = ({ className }) => {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [contrastRatio, setContrastRatio] = useState(0);

  useEffect(() => {
    // Simple contrast ratio calculation
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
    };

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16)
      } : null;
    };

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (fgRgb && bgRgb) {
      const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      const brightest = Math.max(fgLum, bgLum);
      const darkest = Math.min(fgLum, bgLum);
      const ratio = (brightest + 0.05) / (darkest + 0.05);
      setContrastRatio(ratio);
    }
  }, [foreground, background]);

  const isAACompliant = contrastRatio >= 4.5;
  const isAAACompliant = contrastRatio >= 7.0;

  return (
    <div className={cn('p-4 bg-[#1C1C1C] border border-[#424242] rounded-lg', className)}>
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Color Contrast Tester</h3>
      
      <div className="space-y-4">
        {/* Color Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
              Foreground Color
            </label>
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#424242]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
              Background Color
            </label>
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#424242]"
            />
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-4 rounded-lg text-center font-medium"
          style={{ color: foreground, backgroundColor: background }}
        >
          Sample Text
        </div>

        {/* Results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#CFCFCF]">Contrast Ratio:</span>
            <span className="text-sm font-medium text-[#F5F5F5]">
              {contrastRatio.toFixed(2)}:1
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isAACompliant ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            )}
            <span className={cn(
              'text-sm',
              isAACompliant ? 'text-green-400' : 'text-red-400'
            )}>
              WCAG AA {isAACompliant ? 'Compliant' : 'Non-compliant'} (4.5:1)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isAAACompliant ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
            )}
            <span className={cn(
              'text-sm',
              isAAACompliant ? 'text-green-400' : 'text-yellow-400'
            )}>
              WCAG AAA {isAAACompliant ? 'Compliant' : 'Non-compliant'} (7.0:1)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SCREEN READER TESTER =====

interface ScreenReaderTesterProps {
  className?: string;
}

const ScreenReaderTester: React.FC<ScreenReaderTesterProps> = ({ className }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announceMessage = () => {
    if (message.trim()) {
      aria.announce(message, priority);
    }
  };

  return (
    <div className={cn('p-4 bg-[#1C1C1C] border border-[#424242] rounded-lg', className)}>
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Screen Reader Tester</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
            Message to Announce
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to announce to screen readers..."
            className="w-full h-20 px-3 py-2 bg-[#0A0A0A] border border-[#424242] text-[#F5F5F5] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'polite' | 'assertive')}
            className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#424242] text-[#F5F5F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40]"
          >
            <option value="polite">Polite</option>
            <option value="assertive">Assertive</option>
          </select>
        </div>

        <button
          onClick={announceMessage}
          disabled={!message.trim()}
          className="w-full px-4 py-2 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white rounded-lg font-medium hover:from-[#dc2626] hover:to-[#f59e0b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2"
        >
          Announce Message
        </button>

        <div className="text-sm text-[#A3A3A3]">
          <p><strong>Polite:</strong> Announces when the user is idle</p>
          <p><strong>Assertive:</strong> Announces immediately, interrupting current speech</p>
        </div>
      </div>
    </div>
  );
};

// ===== ACCESSIBILITY DASHBOARD =====

interface AccessibilityDashboardProps {
  className?: string;
}

const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ className }) => {
  const [selectedTab, setSelectedTab] = useState<'audit' | 'contrast' | 'screenreader'>('audit');

  const tabs = [
    { id: 'audit', label: 'Audit', icon: CheckCircleIcon },
    { id: 'contrast', label: 'Contrast', icon: EyeIcon },
    { id: 'screenreader', label: 'Screen Reader', icon: InformationCircleIcon },
  ];

  return (
    <div className={cn('bg-[#1C1C1C] border border-[#424242] rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-[#424242]/40">
        <h2 className="text-xl font-bold text-[#F5F5F5]">Accessibility Testing</h2>
        <p className="text-sm text-[#A3A3A3] mt-1">
          Test and validate accessibility compliance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#424242]/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                selectedTab === tab.id
                  ? 'text-[#FFAB40] border-b-2 border-[#FFAB40] bg-[#FFAB40]/10'
                  : 'text-[#A3A3A3] hover:text-[#CFCFCF] hover:bg-[#2E2E2E]/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {selectedTab === 'audit' && <AccessibilityAudit />}
        {selectedTab === 'contrast' && <ColorContrastTester />}
        {selectedTab === 'screenreader' && <ScreenReaderTester />}
      </div>
    </div>
  );
};

export {
  AccessibilityAudit,
  ColorContrastTester,
  ScreenReaderTester,
  AccessibilityDashboard
};
