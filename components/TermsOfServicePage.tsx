import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <>
      <p className="text-neutral-400 mb-4 text-base">Last Updated: August 15, 2025</p>

      <p>Welcome to Otakon! These Terms of Service ("Terms") govern your use of our AI-powered gaming companion service. By using Otakon, you agree to be bound by these Terms.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
      <p>By accessing or using Otakon, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our service.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
      <p>Otakon is an AI-powered gaming companion that provides spoiler-free assistance to gamers. Our service analyzes screenshots and provides contextual hints without revealing plot details or solutions.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Accounts</h2>
      <p>To use certain features of Otakon, you must create an account. You are responsible for:</p>
      <ul className="list-disc list-inside space-y-2 mt-4 text-base">
        <li>Providing accurate and complete information</li>
        <li>Maintaining the security of your account credentials</li>
        <li>All activities that occur under your account</li>
        <li>Notifying us immediately of any unauthorized use</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Acceptable Use</h2>
      <p>You agree not to use Otakon for any unlawful or prohibited activities, including:</p>
      <ul className="list-disc list-inside space-y-2 mt-4 text-base">
        <li>Violating any applicable laws or regulations</li>
        <li>Infringing on intellectual property rights</li>
        <li>Transmitting harmful or malicious content</li>
        <li>Attempting to reverse engineer or hack our systems</li>
        <li>Using the service for commercial purposes without permission</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Subscription and Billing</h2>
      <p>Otakon offers both free and paid subscription tiers:</p>
      <ul className="list-disc list-inside space-y-2 mt-4 text-base">
        <li><strong>Free Tier:</strong> Limited queries per day</li>
        <li><strong>Pro Tier:</strong> Increased query limits and additional features</li>
        <li><strong>Vanguard Pro Tier:</strong> Premium features and priority support</li>
      </ul>
      <p className="mt-4">Subscriptions are billed in advance and are non-refundable. You may cancel your subscription at any time through your account settings.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Privacy and Data</h2>
      <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using Otakon, you consent to our data practices as described in our Privacy Policy.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Intellectual Property</h2>
      <p>Otakon and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Disclaimers</h2>
      <p>Otakon is provided "as is" without warranties of any kind. We do not guarantee that our service will be uninterrupted, error-free, or completely accurate. Gaming assistance is provided for entertainment purposes only.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of Otakon.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through our service. Continued use of Otakon after changes constitutes acceptance of the new Terms.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Termination</h2>
      <p>We may terminate or suspend your account at any time for violations of these Terms. You may also terminate your account at any time by contacting us.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Contact Information</h2>
      <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@otakon.app" className="text-[#FFAB40] hover:underline">support@otakon.app</a>.</p>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">13. Governing Law</h2>
      <p>These Terms are governed by the laws of India. Any disputes will be resolved in the courts of Hyderabad, India.</p>
    </>
  );
};

export default TermsOfServicePage;
