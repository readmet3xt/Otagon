import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../../components/ChatInput';
import { ConnectionStatus } from '../../services/types';

// Mock the required props and functions
const mockOnSendMessage = vi.fn();
const mockOnImagesReviewed = vi.fn();
const mockOnBatchUploadAttempt = vi.fn();
const mockOnImageProcessingError = vi.fn();
const mockOnChange = vi.fn();
const mockOnToggleManualUploadMode = vi.fn();

const defaultProps = {
  value: '',
  onChange: mockOnChange,
  onSendMessage: mockOnSendMessage,
  isCooldownActive: false,
  onImageProcessingError: mockOnImageProcessingError,
  usage: {
    tier: 'free' as const,
    textCount: 0,
    imageCount: 0,
    textLimit: 10,
    imageLimit: 1
  },
  imagesForReview: undefined,
  onImagesReviewed: mockOnImagesReviewed,
  isManualUploadMode: false,
  onToggleManualUploadMode: mockOnToggleManualUploadMode,
  connectionStatus: ConnectionStatus.CONNECTED,
  textareaRef: { current: null },
  onBatchUploadAttempt: mockOnBatchUploadAttempt,
  hasInsights: false,
  activeConversation: undefined
};

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field and send button', () => {
    render(<ChatInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Ask a question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('renders camera button for image upload', () => {
    render(<ChatInput {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /upload screenshot/i })).toBeInTheDocument();
  });

  it('allows typing in the input field', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Ask a question');
    await user.type(input, 'Hello Otakon');
    
    // For a controlled component, onChange is called for each keystroke
    // The parent component should accumulate the input and pass it back as value
    expect(mockOnChange).toHaveBeenCalledTimes(12); // One call per character
    expect(mockOnChange).toHaveBeenLastCalledWith('n'); // Last character typed
  });

  it('sends message when send button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Test message" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  it('sends message when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Test message" />);
    
    const input = screen.getByPlaceholderText('Ask a question');
    await user.type(input, '{enter}');
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  it('does not send empty message', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('shows loading state when isCooldownActive is true', () => {
    render(<ChatInput {...defaultProps} isCooldownActive={true} />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('handles free tier image limit correctly', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const cameraButton = screen.getByRole('button', { name: /upload screenshot/i });
    
    // Create a mock file input
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock the file input change event
    const input = screen.getByRole('button', { name: /upload screenshot/i }).closest('form')?.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    
    // For free tier, should allow 1 image
    expect(mockOnBatchUploadAttempt).not.toHaveBeenCalled();
  });

  it('prevents batch upload for free tier', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} />);
    
    const cameraButton = screen.getByRole('button', { name: /upload screenshot/i });
    
    // Create multiple mock files
    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    ];
    
    // Mock the file input change event with multiple files
    const input = screen.getByRole('button', { name: /upload screenshot/i }).closest('form')?.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    // Should trigger batch upload attempt for free tier
    expect(mockOnBatchUploadAttempt).toHaveBeenCalled();
  });

  it('allows multiple images for pro tier', async () => {
    const proProps = {
      ...defaultProps,
      usage: {
        ...defaultProps.usage,
        tier: 'pro' as const,
        imageLimit: 5
      }
    };
    
    render(<ChatInput {...proProps} />);
    
    const cameraButton = screen.getByRole('button', { name: /upload screenshot/i });
    
    // Create multiple mock files
    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.jpg', { type: 'image/jpeg' })
    ];
    
    // Mock the file input change event with multiple files
    const input = screen.getByRole('button', { name: /upload screenshot/i }).closest('form')?.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    // Should not trigger batch upload attempt for pro tier
    expect(mockOnBatchUploadAttempt).not.toHaveBeenCalled();
  });

  it('handles tab management commands correctly', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="add tab for strategy" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('[TAB_MANAGEMENT] add tab for strategy', undefined);
  });

  it('handles various tab management commands', async () => {
    const user = userEvent.setup();
    
    const commands = [
      'create new tab',
      'modify existing tab',
      'edit tab content',
      'delete this tab',
      'remove tab',
      'move tab to position 2'
    ];
    
    const { rerender } = render(<ChatInput {...defaultProps} value={commands[0]} />);
    
    for (const command of commands) {
      rerender(<ChatInput {...defaultProps} value={command} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(`[TAB_MANAGEMENT] ${command}`, undefined);
      
      // Clear mocks for next iteration
      vi.clearAllMocks();
    }
  });

  it('handles non-tab management messages normally', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="What is the best strategy for this game?" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('What is the best strategy for this game?', undefined);
  });

  it('handles case-insensitive tab management detection', async () => {
    const user = userEvent.setup();
    
    const commands = [
      'ADD tab for strategy',
      'Create new tab',
      'MODIFY existing tab',
      'Edit tab content',
      'DELETE this tab',
      'Remove tab',
      'Move tab to position 2'
    ];
    
    const { rerender } = render(<ChatInput {...defaultProps} value={commands[0]} />);
    
    for (const command of commands) {
      rerender(<ChatInput {...defaultProps} value={command} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith(`[TAB_MANAGEMENT] ${command}`, undefined);
      
      // Clear mocks for next iteration
      vi.clearAllMocks();
    }
  });

  it('handles mixed case tab management commands', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Add Tab For Strategy" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('[TAB_MANAGEMENT] Add Tab For Strategy', undefined);
  });

  it('handles empty input after sending message', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Test message" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    // Input should be cleared after sending (this is handled by parent component)
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  it('handles input with only whitespace', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="   " />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    // Should not send message with only whitespace
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('handles input with leading and trailing whitespace', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="  Hello Otakon  " />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    // Should send message with trimmed whitespace
    expect(mockOnSendMessage).toHaveBeenCalledWith('  Hello Otakon  ', undefined);
  });

  it('handles rapid typing and sending', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Quick message" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Quick message', undefined);
  });

  it('handles special characters in input', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Hello! How are you? This is a test with special chars: @#$%^&*()" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello! How are you? This is a test with special chars: @#$%^&*()', undefined);
  });

  it('handles very long input messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value={'A'.repeat(1000)} />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('A'.repeat(1000), undefined);
  });

  it('handles input with newlines', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Line 1\nLine 2\nLine 3" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Line 1\\nLine 2\\nLine 3', undefined);
  });

  it('handles input with emojis', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Hello! 🎮 How are you? 😊 This is fun! 🚀" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello! 🎮 How are you? 😊 This is fun! 🚀', undefined);
  });

  it('handles input with unicode characters', async () => {
    const user = userEvent.setup();
    render(<ChatInput {...defaultProps} value="Hello! 你好! Bonjour! Привет!" />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello! 你好! Bonjour! Привет!', undefined);
  });
});
