import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MessageSquare, Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OnsiteActions({ site, profile, location }) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.SitePhoto.create({
        site_id: site.id,
        employee_id: profile.id,
        photo_url: file_url,
        caption: photoCaption,
        upload_date: new Date().toISOString(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      });

      toast.success('Photo uploaded successfully!');
      setPhotoCaption('');
      setSelectedFile(null);
    } catch (err) {
      toast.error('Failed to upload photo: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!site.manager_id) {
      toast.error('No manager assigned to this site');
      return;
    }

    setIsSendingMessage(true);
    try {
      await base44.entities.SiteMessage.create({
        site_id: site.id,
        employee_id: profile.id,
        manager_id: site.manager_id,
        message: message.trim(),
        status: 'pending'
      });

      toast.success('Message sent to manager!');
      setMessage('');
    } catch (err) {
      toast.error('Failed to send message: ' + err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5 text-blue-600" />
            Upload Site Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Caption (optional)</Label>
            <Input
              placeholder="Add a caption..."
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
          </div>
          {isUploadingPhoto && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Message Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Ask a question or report an issue..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSendingMessage || !message.trim()}
            className="w-full"
          >
            {isSendingMessage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}