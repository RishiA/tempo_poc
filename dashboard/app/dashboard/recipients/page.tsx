'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRecipients } from '@/hooks/useRecipients'
import { toast } from 'sonner'

export default function RecipientsPage() {
  const { recipients, addRecipient, deleteRecipient, searchRecipients, isLoading } = useRecipients()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRecipientName, setNewRecipientName] = useState('')
  const [newRecipientAddress, setNewRecipientAddress] = useState('')

  const filteredRecipients = useMemo(() => {
    return searchRecipients(searchQuery)
  }, [searchRecipients, searchQuery])

  const handleAddRecipient = async () => {
    try {
      addRecipient(newRecipientName, newRecipientAddress)
      toast.success('Recipient added', {
        description: `${newRecipientName} has been saved`,
      })
      setNewRecipientName('')
      setNewRecipientAddress('')
      setIsAddDialogOpen(false)
    } catch (error) {
      toast.error('Failed to add recipient', {
        description: error instanceof Error ? error.message : 'Please check your input',
      })
    }
  }

  const handleDeleteRecipient = (id: string, name: string) => {
    try {
      deleteRecipient(id)
      toast.success('Recipient deleted', {
        description: `${name} has been removed`,
      })
    } catch (error) {
      toast.error('Failed to delete recipient', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }

  const formatLastUsed = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  if (isLoading) {
    return (
      <div className="container py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">Loading recipients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Recipients</h1>
            <p className="text-muted-foreground mt-2">
              Manage addresses you frequently send to
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Recipient</DialogTitle>
                <DialogDescription>
                  Save a wallet address with a friendly name for easy access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Name</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Alice, Vendor XYZ, etc."
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-address">Wallet Address</Label>
                  <Input
                    id="recipient-address"
                    placeholder="0x..."
                    value={newRecipientAddress}
                    onChange={(e) => setNewRecipientAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRecipient}>
                    Add Recipient
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Recipients List */}
        {filteredRecipients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-muted-foreground">
                {searchQuery ? 'No recipients match your search' : 'No saved recipients yet'}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add recipients to send payments faster
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRecipients.map((recipient) => (
              <Card key={recipient.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                          {recipient.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{recipient.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Last used: {formatLastUsed(recipient.lastUsed)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Address</p>
                        <p className="font-mono text-sm break-all">{recipient.address}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecipient(recipient.id, recipient.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">About Saved Recipients</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Save addresses you frequently send to for faster payments. Recipients are stored locally in your browser and never leave your device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
