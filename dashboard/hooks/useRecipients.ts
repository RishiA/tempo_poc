import { useState, useEffect, useCallback } from 'react';
import { type Recipient, isValidAddress } from '@/types/recipient';

const STORAGE_KEY = 'tempo_recipients';

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipients from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Recipient[];
        setRecipients(parsed);
      }
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save recipients to localStorage whenever they change
  const saveRecipients = useCallback((newRecipients: Recipient[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipients));
      setRecipients(newRecipients);
    } catch (error) {
      console.error('Failed to save recipients:', error);
      throw new Error('Failed to save recipient');
    }
  }, []);

  // Add a new recipient
  const addRecipient = useCallback((name: string, address: string) => {
    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (name.length > 50) {
      throw new Error('Name must be 50 characters or less');
    }
    if (!isValidAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    // Check for duplicates
    const normalizedAddress = address.toLowerCase();
    const normalizedName = name.trim().toLowerCase();
    
    if (recipients.some(r => r.address.toLowerCase() === normalizedAddress)) {
      throw new Error('This address is already saved');
    }
    if (recipients.some(r => r.name.toLowerCase() === normalizedName)) {
      throw new Error('A recipient with this name already exists');
    }

    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      address: address as `0x${string}`,
      createdAt: Date.now(),
    };

    const updated = [...recipients, newRecipient];
    saveRecipients(updated);
    return newRecipient;
  }, [recipients, saveRecipients]);

  // Delete a recipient
  const deleteRecipient = useCallback((id: string) => {
    const updated = recipients.filter(r => r.id !== id);
    saveRecipients(updated);
  }, [recipients, saveRecipients]);

  // Update last used timestamp
  const updateLastUsed = useCallback((address: string) => {
    const normalizedAddress = address.toLowerCase();
    const updated = recipients.map(r => 
      r.address.toLowerCase() === normalizedAddress
        ? { ...r, lastUsed: Date.now() }
        : r
    );
    saveRecipients(updated);
  }, [recipients, saveRecipients]);

  // Get recipient by address
  const getRecipientByAddress = useCallback((address: string) => {
    const normalizedAddress = address.toLowerCase();
    return recipients.find(r => r.address.toLowerCase() === normalizedAddress);
  }, [recipients]);

  // Search/filter recipients
  const searchRecipients = useCallback((query: string) => {
    if (!query || query.trim().length === 0) {
      return recipients;
    }
    
    const q = query.trim().toLowerCase();
    return recipients.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }, [recipients]);

  return {
    recipients,
    isLoading,
    addRecipient,
    deleteRecipient,
    updateLastUsed,
    getRecipientByAddress,
    searchRecipients,
  };
}
