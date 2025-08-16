import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import GoogleIcon from './GoogleIcon';
import EmailIcon from './EmailIcon';
import PWAInstallBanner from './PWAInstallBanner';
import { authService } from '../services/supabase';

// 🧪 TESTING ONLY: This component includes navigation buttons for development purposes

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#5865F2" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
  </svg>
);

interface LoginSplashScreenProps {
    onComplete: () => void;
    installPrompt: any;
    setInstallPrompt: (prompt: any) => void;
}

const LoginSplashScreen: React.FC<LoginSplashScreenProps> = ({ onComplete, installPrompt, setInstallPrompt }) => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailLogin, setIsEmailLogin] = useState(false);
    
    // Animation states for buttons
    const [buttonAnimations, setButtonAnimations] = useState({
        google: false,
        discord: false,
        email: false
    });

    useEffect(() => {
        const isMobile = /Mobi/i.test(window.navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const hasDismissed = localStorage.getItem('otakonInstallDismissed') === 'true';

        if (isMobile && installPrompt && !isStandalone && !hasDismissed) {
            setShowInstallBanner(true);
        }
    }, [installPrompt]);


    const handleAuth = async (method: 'google' | 'discord' | 'email') => {
        // Only animate the specific button that was clicked
        setButtonAnimations(prev => ({ 
            google: false, 
            discord: false, 
            email: false,
            [method]: true 
        }));
        
        if (method === 'email') {
            setIsEmailLogin(true);
            // Reset animation after a short delay
            setTimeout(() => setButtonAnimations(prev => ({ ...prev, [method]: false })), 300);
            return;
        }
        
        localStorage.setItem('otakonAuthMethod', method);
        
        try {
            if (method === 'google') {
                const result = await authService.signInWithGoogle();
                if (result.success) {
                    // For OAuth, the user will be redirected to the callback URL
                    console.log('Google OAuth initiated, redirecting...');
                } else {
                    console.error('Google OAuth failed:', result.error);
                    // Reset animation on error
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            } else if (method === 'discord') {
                const result = await authService.signInWithDiscord();
                if (result.success) {
                    // For OAuth, the user will be redirected to the callback URL
                    console.log('Discord OAuth initiated, redirecting...');
                } else {
                    console.error('Discord OAuth failed:', result.error);
                    // Reset animation on error
                    setButtonAnimations(prev => ({ ...prev, [method]: false }));
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            // Reset animation on error
            setButtonAnimations(prev => ({ ...prev, [method]: false }));
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsSigningIn(true);
        
        try {
            const result = await authService.signIn(email, password);
            if (result.success) {
                // Email login successful, complete the flow
                localStorage.setItem('otakonAuthMethod', 'email');
                onComplete();
            } else {
                console.error('Email login failed:', result.error);
                setIsSigningIn(false);
            }
        } catch (error) {
            console.error('Email login error:', error);
            setIsSigningIn(false);
        }
    };

    const handleBackToOptions = () => {
        setIsEmailLogin(false);
        setEmail('');
        setPassword('');
    };

    const handleSkip = () => {
        localStorage.setItem('otakonAuthMethod', 'skip');
        onComplete();
    };

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
        setShowInstallBanner(false);
    };
    
    const handleDismiss = () => {
        localStorage.setItem('otakonInstallDismissed', 'true');
        setShowInstallBanner(false);
    };

    return (
        <div className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-6 text-center overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/20 to-transparent pointer-events-none"></div>
            
            <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm">
                {/* Testing Only: Back to Home Button */}
                <div className="absolute top-6 left-6">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 bg-[#2E2E2E]/80 border border-[#424242] text-[#F5F5F5] px-4 py-2 rounded-lg hover:bg-[#424242] transition-colors text-sm font-medium"
                        title="Back to Home (Testing Only)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Home
                    </button>
                </div>

                <div className="flex-shrink-0 mb-6">
                    <Logo />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                    Welcome to Otakon
                </h1>

                <p className="text-lg text-[#A3A3A3] mb-10">
                    Your spoiler-free gaming companion.
                </p>

                {!isEmailLogin ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <button
                            onClick={() => handleAuth('google')}
                            disabled={buttonAnimations.google}
                            className={`w-full bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center gap-3 shadow-md relative overflow-hidden ${
                                buttonAnimations.google 
                                    ? 'scale-95 opacity-80 cursor-not-allowed animate-pulse shadow-lg' 
                                    : 'hover:scale-105 active:scale-95 hover:shadow-lg'
                            }`}
                        >
                            {buttonAnimations.google ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mr-2"></div>
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                <>
                                    <GoogleIcon className="w-6 h-6" />
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleAuth('discord')}
                            disabled={buttonAnimations.discord}
                            className={`w-full bg-[#5865F2] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center gap-3 relative overflow-hidden ${
                                buttonAnimations.discord 
                                    ? 'scale-95 opacity-80 cursor-not-allowed animate-pulse shadow-lg' 
                                    : 'hover:scale-105 active:scale-95 hover:shadow-lg'
                            }`}
                        >
                            {buttonAnimations.discord ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                <>
                                    <DiscordIcon className="w-6 h-6" />
                                    <span>Continue with Discord</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleAuth('email')}
                            disabled={buttonAnimations.email}
                            className={`w-full bg-[#2E2E2E]/80 border border-[#424242] hover:bg-[#424242] text-[#F5F5F5] font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform flex items-center justify-center gap-3 relative overflow-hidden ${
                                buttonAnimations.email 
                                    ? 'scale-95 opacity-80 cursor-not-allowed animate-pulse shadow-lg' 
                                    : 'hover:scale-105 active:scale-95 hover:shadow-lg'
                            }`}
                        >
                            {buttonAnimations.email ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    <span>Opening...</span>
                                </div>
                            ) : (
                                <>
                                    <EmailIcon className="w-6 h-6" />
                                    <span>Continue with Email</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleEmailLogin} className="w-full space-y-4">
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
                                disabled={isSigningIn}
                                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isSigningIn ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Signing In...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                )}
                
                {!isEmailLogin && (
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleSkip}
                            className="text-neutral-400 font-medium py-2 px-6 rounded-full hover:bg-neutral-800/50 transition-colors"
                            title="Skip for now - For testing and development only"
                        >
                            Skip for now
                        </button>
                        <p className="text-xs text-neutral-500">For testing and development only</p>
                        
                        {/* Testing Only: Back to Home Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="text-blue-400 font-medium py-2 px-6 rounded-full hover:bg-blue-900/20 transition-colors border border-blue-500/30"
                                title="Back to Home (Testing Only)"
                            >
                                ← Back to Home
                            </button>
                            <p className="text-xs text-blue-400/60 mt-1">Testing Navigation</p>
                        </div>
                    </div>
                )}
            </main>
            
            <footer className="flex-shrink-0 w-full p-4 text-center text-xs text-neutral-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </footer>

            {showInstallBanner && <PWAInstallBanner onInstall={handleInstall} onDismiss={handleDismiss} />}
        </div>
    );
};

export default React.memo(LoginSplashScreen);
