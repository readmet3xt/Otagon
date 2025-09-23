import { supabase } from './supabase';

export interface ContactFormSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  /**
   * Submit a contact form
   */
  async submitContactForm(formData: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const priority = this.determinePriority(formData.subject, formData.message);
      
      const submission: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        user_id: user?.id || null,
        status: 'new',
        priority: priority as 'low' | 'medium' | 'high',
        ...(formData.source && { source: formData.source })
      };

      // Store contact submission in app_level table
      const { error } = await supabase
        .from('app_level')
        .upsert({
          key: 'contact_submissions',
          value: {
            category: 'contact_submissions',
            event_type: 'contact_form',
            data: {
              name: submission.name,
              email: submission.email,
              subject: submission.subject,
              message: submission.message,
              timestamp: new Date().toISOString(),
              status: 'pending'
            }
          },
          description: 'Contact form submissions',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('Error submitting contact form:', error);
        return { success: false, error: 'Failed to submit contact form' };
      }

      return { success: true, id: crypto.randomUUID() }; // Generate new ID for new structure
    } catch (error) {
      console.error('Contact service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get contact submissions for authenticated users
   */
  async getUserContactSubmissions(): Promise<{ data?: ContactFormSubmission[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'contact_submissions')
        .single();

      if (error) {
        console.error('Error fetching contact submissions:', error);
        return { error: 'Failed to fetch contact submissions' };
      }

      // Transform data back to ContactFormSubmission format
      const submissions = data?.value?.data ? [data.value.data] : [];

      return { data: submissions };
    } catch (error) {
      console.error('Error getting user contact submissions:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update contact submission status (admin function)
   */
  async updateContactStatus(id: string, status: ContactFormSubmission['status'], priority?: ContactFormSubmission['priority']): Promise<{ success: boolean; error?: string }> {
    try {
      // Update contact submission in app_level table
      const { data: currentData, error: fetchError } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'contact_submissions')
        .single();

      if (fetchError) {
        console.error('Error fetching contact submission:', fetchError);
        return { success: false, error: 'Failed to fetch contact submission' };
      }

      // Update the submission data
      const updatedValue = {
        ...currentData.value,
        data: {
          ...currentData.value.data,
          status: status,
          priority: priority || currentData.value.data.priority,
          updated_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('app_level')
        .update({ 
          value: updatedValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'contact_submissions');

      if (error) {
        console.error('Error updating contact status:', error);
        return { success: false, error: 'Failed to update contact status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating contact status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get contact submission by ID
   */
  async getContactSubmission(id: string): Promise<{ data?: ContactFormSubmission; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'contact_submissions')
        .single();

      if (error) {
        console.error('Error fetching contact submission:', error);
        return { error: 'Failed to fetch contact submission' };
      }

      // Transform data back to ContactFormSubmission format
      const submission: ContactFormSubmission = {
        id: (data as any).id,
        user_id: (data as any).user_id || 'unknown',
        name: (data as any).data.name,
        email: (data as any).data.email,
        subject: (data as any).data.subject,
        message: (data as any).data.message,
        status: (data as any).data.status,
        priority: (data as any).data.priority || 'medium',
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at
      };

      return { data: submission };
    } catch (error) {
      console.error('Error getting contact submission:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Determine priority based on subject and message content
   */
  private determinePriority(subject: string, message: string): ContactFormSubmission['priority'] {
    const urgentKeywords = ['urgent', 'critical', 'broken', 'error', 'bug', 'issue', 'problem', 'help', 'support'];
    const content = `${subject} ${message}`.toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    
    if (content.includes('question') || content.includes('inquiry') || content.includes('info')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Get contact statistics (admin function)
   */
  async getContactStatistics(): Promise<{ data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'contact_submissions')
        .single();

      if (error) {
        console.error('Error fetching contact statistics:', error);
        return { error: 'Failed to fetch contact statistics' };
      }

      // Process statistics from stored data
      const contactData = data?.value?.data || {};
      const stats = {
        total: 1,
        byStatus: { [contactData.status || 'pending']: 1 },
        byPriority: { [contactData.priority || 'medium']: 1 },
        byDate: { [contactData.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0]]: 1 }
      };

      return { data: stats };
    } catch (error) {
      console.error('Error getting contact statistics:', error);
      return { error: 'An unexpected error occurred' };
    }
  }
}

export const contactService = ContactService.getInstance();
