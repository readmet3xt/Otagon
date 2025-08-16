import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from '../../components/ChatMessage';
import { ChatMessage as ChatMessageType } from '../../services/types';

// Mock the feedback function
const mockOnFeedback = vi.fn();
const mockOnPromptClick = vi.fn();
const mockOnStop = vi.fn();
const mockOnUpgradeClick = vi.fn();

const defaultProps = {
  message: {
    id: '1',
    role: 'user' as const,
    text: 'Test message',
    images: [],
    isFromPC: false,
    sources: [],
    suggestions: [],
    triumph: undefined,
    showUpgradeButton: false,
    feedback: undefined,
  } as ChatMessageType,
  isLoading: false,
  onStop: mockOnStop,
  onPromptClick: mockOnPromptClick,
  onUpgradeClick: mockOnUpgradeClick,
  onFeedback: mockOnFeedback,
};

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    render(<ChatMessage {...defaultProps} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toHaveClass('text-[#F5F5F5]');
  });

  it('renders user message with images', () => {
    const messageWithImages = {
      ...defaultProps.message,
      images: ['data:image/jpeg;base64,test'],
      text: '',
    };

    render(<ChatMessage {...defaultProps} message={messageWithImages} />);
    
    expect(screen.getByText('1 screenshot uploaded')).toBeInTheDocument();
    expect(screen.getByAltText('User upload 1')).toBeInTheDocument();
  });

  it('renders model message correctly', () => {
    const modelMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'AI response message',
    };

    render(<ChatMessage {...defaultProps} message={modelMessage} />);
    
    expect(screen.getByText('AI response message')).toBeInTheDocument();
  });

  it('renders cancelled message correctly', () => {
    const cancelledMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: '*Request cancelled by user.*',
    };

    render(<ChatMessage {...defaultProps} message={cancelledMessage} />);
    
    expect(screen.getByText('Request cancelled by user.')).toBeInTheDocument();
    expect(screen.getByText('Request cancelled by user.')).toHaveClass('text-[#FF4D4D]');
  });

  it('renders triumph message with confetti', () => {
    const triumphMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'Congratulations!',
      triumph: { type: 'boss_defeated', name: 'Test Boss' },
    };

    render(<ChatMessage {...defaultProps} message={triumphMessage} />);
    
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    // Note: Confetti animation would need more complex testing
  });

  it('handles empty message gracefully', () => {
    const emptyMessage = {
      ...defaultProps.message,
      text: '',
      images: [],
    };

    const { container } = render(<ChatMessage {...defaultProps} message={emptyMessage} />);
    
    // Should not render anything for empty user message
    expect(container.firstChild).toBeNull();
  });

  it('applies correct styling for user message with images', () => {
    const messageWithImages = {
      ...defaultProps.message,
      images: ['data:image/jpeg;base64,test'],
    };

    render(<ChatMessage {...defaultProps} message={messageWithImages} />);
    
    const messageContainer = screen.getByText('Test message').closest('div');
    expect(messageContainer).toHaveClass('bg-[#2E2E2E]', 'border', 'border-[#424242]');
  });

  it('applies correct styling for user message without images', () => {
    render(<ChatMessage {...defaultProps} />);
    
    const messageContainer = screen.getByText('Test message').closest('div');
    expect(messageContainer).toHaveClass('bg-[#E53A3A]/20', 'border', 'border-[#E53A3A]/30');
  });
});
