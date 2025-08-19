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
    
    // Check for the image with specific alt text
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    
    // Check for the upload count text using a more specific approach
    const uploadText = screen.getByText(/📸.*screenshot.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('1 screenshot uploaded');
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
    expect(screen.getByText('Request cancelled by user.')).toHaveClass('text-[#CFCFCF]');
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

  // Add new test for multiple images
  it('renders user message with multiple images correctly', () => {
    const messageWithMultipleImages = {
      ...defaultProps.message,
      images: [
        'data:image/jpeg;base64,test1',
        'data:image/jpeg;base64,test2',
        'data:image/jpeg;base64,test3'
      ],
      text: '',
    };

    render(<ChatMessage {...defaultProps} message={messageWithMultipleImages} />);
    
    // Check for multiple images
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot 2')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot 3')).toBeInTheDocument();
    
    // Check for the correct count text
    const uploadText = screen.getByText(/📸.*screenshots.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('3 screenshots uploaded');
  });

  // Test edge cases
  it('handles user message with both text and images', () => {
    const messageWithTextAndImages = {
      ...defaultProps.message,
      text: 'Check out these screenshots',
      images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
    };

    render(<ChatMessage {...defaultProps} message={messageWithTextAndImages} />);
    
    // Should show both text and images
    expect(screen.getByText('Check out these screenshots')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot 2')).toBeInTheDocument();
    
    // Should not show the "screenshots uploaded" text when there's actual text
    expect(screen.queryByText(/📸.*screenshots.*uploaded/)).not.toBeInTheDocument();
  });

  it('handles user message with exactly 5 images (maximum)', () => {
    const messageWithMaxImages = {
      ...defaultProps.message,
      images: [
        'data:image/jpeg;base64,test1',
        'data:image/jpeg;base64,test2',
        'data:image/jpeg;base64,test3',
        'data:image/jpeg;base64,test4',
        'data:image/jpeg;base64,test5'
      ],
      text: '',
    };

    render(<ChatMessage {...defaultProps} message={messageWithMaxImages} />);
    
    // Check for all 5 images
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByAltText(`Screenshot ${i}`)).toBeInTheDocument();
    }
    
    // Check for the correct count text
    const uploadText = screen.getByText(/📸.*screenshots.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('5 screenshots uploaded');
  });

  it('handles model message with failed response indicators', () => {
    const failedResponseMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'Error: Something went wrong with the request',
    };

    render(<ChatMessage {...defaultProps} message={failedResponseMessage} />);
    
    expect(screen.getByText('Error: Something went wrong with the request')).toBeInTheDocument();
  });

  it('handles model message with timeout indicators', () => {
    const timeoutMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'Timeout: The request took too long to complete',
    };

    render(<ChatMessage {...defaultProps} message={timeoutMessage} />);
    
    expect(screen.getByText('Timeout: The request took too long to complete')).toBeInTheDocument();
  });

  it('handles model message with rate limit indicators', () => {
    const rateLimitMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'Rate limit exceeded. Please try again later.',
    };

    render(<ChatMessage {...defaultProps} message={rateLimitMessage} />);
    
    expect(screen.getByText('Rate limit exceeded. Please try again later.')).toBeInTheDocument();
  });

  it('handles model message with network error indicators', () => {
    const networkErrorMessage = {
      ...defaultProps.message,
      role: 'model' as const,
      text: 'Network error: Unable to connect to the server',
    };

    render(<ChatMessage {...defaultProps} message={networkErrorMessage} />);
    
    expect(screen.getByText('Network error: Unable to connect to the server')).toBeInTheDocument();
  });

  it('handles user message with single image and no text', () => {
    const singleImageMessage = {
      ...defaultProps.message,
      images: ['data:image/jpeg;base64,test'],
      text: '',
    };

    render(<ChatMessage {...defaultProps} message={singleImageMessage} />);
    
    // Should show the image
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    
    // Should show "1 screenshot uploaded" (singular)
    const uploadText = screen.getByText(/📸.*screenshot.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('1 screenshot uploaded');
    
    // Should not show "screenshots" (plural)
    expect(uploadText.textContent).not.toContain('1 screenshots uploaded');
  });

  it('handles user message with two images and no text', () => {
    const twoImageMessage = {
      ...defaultProps.message,
      images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
      text: '',
    };

    render(<ChatMessage {...defaultProps} message={twoImageMessage} />);
    
    // Should show both images
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot 2')).toBeInTheDocument();
    
    // Should show "2 screenshots uploaded" (plural)
    const uploadText = screen.getByText(/📸.*screenshots.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('2 screenshots uploaded');
  });

  it('handles user message with images from PC client', () => {
    const pcImageMessage = {
      ...defaultProps.message,
      images: ['data:image/jpeg;base64,test'],
      text: '',
      isFromPC: true,
    };

    render(<ChatMessage {...defaultProps} message={pcImageMessage} />);
    
    // Should still show the image correctly
    expect(screen.getByAltText('Screenshot 1')).toBeInTheDocument();
    
    // Should show the upload count text
    const uploadText = screen.getByText(/📸.*screenshot.*uploaded/);
    expect(uploadText).toBeInTheDocument();
    expect(uploadText.textContent).toContain('1 screenshot uploaded');
  });

  it('handles user message with sources and suggestions', () => {
    const messageWithSources = {
      ...defaultProps.message,
      sources: [
        { uri: 'https://example.com', title: 'Example Source' }
      ],
      suggestions: ['Suggestion 1', 'Suggestion 2'],
    };

    render(<ChatMessage {...defaultProps} message={messageWithSources} />);
    
    // Should show the main message
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Note: Sources and suggestions are typically handled by parent components
    // This test ensures the message still renders correctly with these properties
  });

  it('handles user message with triumph data', () => {
    const messageWithTriumph = {
      ...defaultProps.message,
      triumph: { type: 'achievement_unlocked', name: 'First Victory' },
    };

    render(<ChatMessage {...defaultProps} message={messageWithTriumph} />);
    
    // Should show the message normally (triumph is typically handled by model messages)
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('handles user message with upgrade button flag', () => {
    const messageWithUpgrade = {
      ...defaultProps.message,
      showUpgradeButton: true,
    };

    render(<ChatMessage {...defaultProps} message={messageWithUpgrade} />);
    
    // Should show the message normally (upgrade button is typically handled by parent components)
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('handles user message with feedback data', () => {
    const messageWithFeedback = {
      ...defaultProps.message,
      feedback: 'up' as const,
    };

    render(<ChatMessage {...defaultProps} message={messageWithFeedback} />);
    
    // Should show the message normally (feedback is typically handled by parent components)
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
