-- User Creation Trigger for Otakon
-- Run this AFTER the main schema is created successfully

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile
    INSERT INTO user_profiles (id, display_name)
    VALUES (NEW.id, NEW.email);
    
    -- Insert usage record
    INSERT INTO usage (user_id, text_limit, image_limit, tier)
    VALUES (NEW.id, 55, 60, 'free');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
