import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import GoogleIcon from './GoogleIcon';
import EmailIcon from './EmailIcon';
import DiscordIcon from './DiscordIcon';
import { authService } from '../services/supabase';
import Button from './ui/Button';
import { useAnalytics } from '../hooks/useAnalytics';

interface LoginSplashScreenProps {
    onComplete: () => void;
    onOpenPrivacy?: () => void;
    onOpenTerms?: () => void;
}

type EmailMode = 'options' | 'signin' | 'signup' | 'forgot-password';

const LoginSplashScreen: React.FC<LoginSplashScreenProps> = ({ onComplete, onOpenPrivacy, onOpenTerms }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailMode, setEmailMode] = useState<EmailMode>('options');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Animation states for buttons
    const [buttonAnimations, setButtonAnimations] = useState({
        google: false,
        discord: false,
        email: false
    });

    // Analytics tracking
    const { startOnboardingStep, completeOnboardingStep, trackOnboardingDropOff, trackButtonClick } = useAnalytics();

    // Start tracking onboarding step
    useEffect(() => {
        startOnboardingStep('login', 1, { component: 'LoginSplashScreen' });
        
        // Track page view
        return () => {
            // Component will unmount, analytics hook will handle cleanup
        };
    }, [startOnboardingStep]);

    const handleAuth = async (method: 'google' | 'discord' | 'email') => {
        // Track button click
        trackButtonClick(method, 'LoginSplashScreen', { method });
        
        // Only animate the specific button that was clicked
        setButtonAnimations(prev => ({ 
            google: false, 
            discord: false, 
            email: false,
            [method]: true 
        }));
        
        if (method === 'email') {
            setEmailMode('signin');
            // Reset animation after a short delay
            setTimeout(() => setButtonAnimations(prev => ({ ...prev, [method]: false })), 300);
            return;
        }
        
        localStorage.setItem('otakonAuthMethod', method);
        
        try {
            if (method === 'google') {
                const result = await authService.signInWithGoogle();
                if (result.success) {
                    console.log('Google OAuth successful, proceeding to next screen...');
                    completeOnboardingStep('login', 1, { method: 'google', success: true });
                    onComplete();
                } else {
                    console.error('Google OAuth failed:', result.error);
                    trackOnboardingDropOff('login', 1, 'google_oauth_failed', { error: result.error });
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            } else if (method === 'discord') {
                const result = await authService.signInWithDiscord();
                if (result.success) {
                    console.log('Discord OAuth successful, proceeding to next screen...');
                    completeOnboardingStep('login', 1, { method: 'discord', success: true });
                    onComplete();
                } else {
                    console.error('Discord OAuth failed:', result.error);
                    trackOnboardingDropOff('login', 1, 'discord_oauth_failed', { error: result.error });
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            trackOnboardingDropOff('login', 1, 'auth_error', { error: error.toString() });
            setButtonAnimations(prev => ({ ...prev, [method]: false }));
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.signIn(email, password);
            if (result.success) {
                localStorage.setItem('otakonAuthMethod', 'email');
                completeOnboardingStep('login', 1, { method: 'email', success: true });
                onComplete();
            } else {
                setErrorMessage(result.error?.message || 'Sign in failed. Please check your credentials.');
                trackOnboardingDropOff('login', 1, 'email_signin_failed', { error: result.error?.message });
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
            trackOnboardingDropOff('login', 1, 'email_signin_error', { error: error.toString() });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) return;
        
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.signUp(email, password);
            if (result.success) {
                setSuccessMessage('Account created successfully! Please check your email to verify your account.');
                setTimeout(() => {
                    setEmailMode('signin');
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(result.error?.message || 'Sign up failed. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const result = await authService.resetPassword(email);
            if (result.success) {
                setSuccessMessage('Password reset email sent! Please check your inbox.');
                setTimeout(() => {
                    setEmailMode('signin');
                    setSuccessMessage('');
                }, 3000);
            } else {
                setErrorMessage(result.error?.message || 'Failed to send reset email. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToOptions = () => {
        setEmailMode('options');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleSkip = () => {
        onComplete();
    };

    const renderEmailForm = () => {
        switch (emailMode) {
            case 'signin':
                return (
                    <form onSubmit={handleEmailSignIn} className="w-full space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                            <p className="text-[#A3A3A3]">Welcome back! Sign in to your account</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-[#2E2E2E] border border-[#424242] text-[#F5F5F5] font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-[#424242]"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Signing In...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <button
                                type="button"
                                onClick={() => setEmailMode('forgot-password')}
                                className="text-sm text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
                            >
                                Forgot your password?
                            </button>
                            <div className="text-sm text-[#A3A3A3]">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setEmailMode('signup')}
                                    className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
                                >
                                    Sign up
                                </button>
                            </div>
                        </div>
                    </form>
                );

            case 'signup':
                return (
                    <form onSubmit={handleEmailSignUp} className="w-full space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                            <p className="text-[#A3A3A3]">Join Otakon AI and start your gaming journey</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-[#2E2E2E] border border-[#424242] text-[#F5F5F5] font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-[#424242]"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center text-sm text-[#A3A3A3]">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => setEmailMode('signin')}
                                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                );

            case 'forgot-password':
                return (
                    <form onSubmit={handleForgotPassword} className="w-full space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                            <p className="text-[#A3A3A3]">Enter your email to receive a password reset link</p>
                        </div>
                        
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {errorMessage}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
                                {successMessage}
                            </div>
                        )}
                        
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToOptions}
                                className="flex-1 bg-[#2E2E2E] border border-[#424242] text-[#F5F5F5] font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-[#424242]"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Sending...
                                    </div>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center text-sm text-[#A3A3A3]">
                            Remember your password?{' '}
                            <button
                                type="button"
                                onClick={() => setEmailMode('signin')}
                                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#111111] text-white flex flex-col">
            {/* Main Content - Centered vertically with proper spacing */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm text-center space-y-4">
                    {/* Logo and Title Section - Grouped together at top */}
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <Logo />
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            Welcome to Otakon
                        </h1>
                        <p className="text-lg text-white">
                            Your spoiler-free gaming companion.
                        </p>
                    </div>
                    
                    {/* Much Smaller Gap - Minimal space between header and buttons */}
                    <div className="h-8"></div>
                    
                    {/* Dynamic Form Section */}
                    {emailMode === 'options' ? (
                        /* Social Login Options */
                        <div className="space-y-3">
                        <Button
                            onClick={() => handleAuth('google')}
                            disabled={buttonAnimations.google}
                            variant="ghost"
                            size="lg"
                            fullWidth
                            className={`bg-white text-gray-800 shadow-md relative overflow-hidden ${
                                buttonAnimations.google 
                                    ? 'scale-95 opacity-80 cursor-not-allowed animate-pulse' 
                                    : 'hover:scale-[1.02] active:scale-98'
                            }`}
                        >
                            {buttonAnimations.google ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mr-2"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <GoogleIcon className="w-5 h-5" />
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </Button>
                        
                        <Button
                            onClick={() => handleAuth('discord')}
                            disabled={buttonAnimations.discord}
                            variant="ghost"
                            size="lg"
                            fullWidth
                            className={`bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white shadow-md relative overflow-hidden ${
                                buttonAnimations.discord 
                                    ? 'scale-95 opacity-80 cursor-not-allowed animate-pulse' 
                                    : 'hover:scale-[1.02] active:scale-98'
                            }`}
                        >
                            {buttonAnimations.discord ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <DiscordIcon className="w-5 h-5 text-white" />
                                    <span>Continue with Discord</span>
                                </>
                            )}
                        </Button>
                        
                        {/* Separation Line */}
                        <div className="flex items-center py-2">
                            <div className="flex-1 border-t border-[#424242]"></div>
                            <span className="px-4 text-sm text-[#6E6E6E]">or</span>
                            <div className="flex-1 border-t border-[#424242]"></div>
                        </div>
                        
                        {/* Email Input Fields */}
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                                />
                            </div>
                            
                            {/* Forgot Password and Create Account Links - Between email and password */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => setEmailMode('forgot-password')}
                                    className="text-sm text-[#A3A3A3] hover:text-white transition-colors"
                                >
                                    Forgot your password?
                                </button>
                                <button
                                    onClick={() => setEmailMode('signup')}
                                    className="text-sm text-[#FFAB40] hover:text-[#FF4D4D] transition-colors font-medium"
                                >
                                    Create account
                                </button>
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-[#2E2E2E] border border-[#424242] rounded-lg py-3 px-4 text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] transition-colors"
                                />
                            </div>
                            
                            {/* Sign In Button */}
                            <Button
                                onClick={handleEmailSignIn}
                                disabled={isLoading || !email || !password}
                                variant={isLoading || !email || !password ? "secondary" : "primary"}
                                size="lg"
                                fullWidth
                                loading={isLoading}
                            >
                                {!isLoading && <EmailIcon className="w-5 h-5" />}
                                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                            </Button>
                        </div>
                        
                        {/* Guest Mode and Go Back Buttons - Moved further below with consistent sizing */}
                        <div className="pt-6 space-y-3">
                            <Button
                                onClick={handleSkip}
                                variant="outline"
                                size="lg"
                                fullWidth
                                title="Skip for now - For testing and development only"
                            >
                                Enter Guest Mode
                            </Button>
                            
                            <Button
                                onClick={() => window.location.href = '/'}
                                variant="outline"
                                size="lg"
                                fullWidth
                                title="Go back to landing page - For testing purposes"
                            >
                                Go Back
                            </Button>
                        </div>
                        </div>
                    ) : (
                        /* Email Forms (Sign In, Sign Up, Forgot Password) */
                        <div className="w-full">
                            {renderEmailForm()}
                            
                            {/* Back to Options Button */}
                            <div className="pt-4 text-center">
                                <button
                                    onClick={() => setEmailMode('options')}
                                    className="text-[#A3A3A3] hover:text-white transition-colors text-sm"
                                >
                                    ← Back to login options
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex-shrink-0 px-6 pb-6 text-center">
                <p className="text-xs text-[#A3A3A3]">
                    By continuing, you agree to our{' '}
                    {onOpenTerms ? (
                        <button
                            onClick={onOpenTerms}
                            className="text-[#FFAB40] hover:text-[#FF4D4D] transition-colors underline"
                        >
                            Terms of Service
                        </button>
                    ) : (
                        <span className="text-[#FFAB40]">Terms of Service</span>
                    )}
                    {' '}and{' '}
                    {onOpenPrivacy ? (
                        <button
                            onClick={onOpenPrivacy}
                            className="text-[#FFAB40] hover:text-[#FF4D4D] transition-colors underline"
                        >
                            Privacy Policy
                        </button>
                    ) : (
                        <span className="text-[#FFAB40]">Privacy Policy</span>
                    )}
                    .
                </p>
            </div>
        </div>
    );
};

export default React.memo(LoginSplashScreen);
