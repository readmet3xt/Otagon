import React from 'react';

const SubscriptionSettingsTab: React.FC = () => {
    const handleManageSubscription = () => {
        // In a real application, this would redirect to a Stripe customer portal URL
        alert("This will open the subscription management portal (e.g., Stripe) where you can cancel or update your plan.");
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-4">Manage Subscription</h2>
            <div className="bg-[#2E2E2E]/60 p-4 rounded-lg">
                <p className="text-neutral-300 mb-4">
                    You can manage your subscription, view invoices, and update your payment method through our secure payment provider portal.
                </p>
                <button
                    onClick={handleManageSubscription}
                    className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-6 rounded-lg transition-transform hover:scale-105"
                >
                    Go to Billing Portal
                </button>
            </div>
        </div>
    );
};

export default SubscriptionSettingsTab;
