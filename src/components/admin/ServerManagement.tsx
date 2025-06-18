import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, WifiOff, AlertCircle, Save, TestTube } from 'lucide-react';

const ServerManagement = () => {
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 21,
    username: '',
    password: '',
    protocol: 'ftp',
    passive_mode: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServer();
  }, []);

  const fetchServer = async () => {
    try {
      const { data, error } = await supabase
        .from('ftp_servers')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setServer(data);
        setFormData({
          name: data.name,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          protocol: data.protocol,
          passive_mode: data.passive_mode
        });
      }
    } catch (error: any) {
      console.error('Error fetching server:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ftp-operations', {
        body: {
          action: 'test_connection',
          config: formData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connection successful",
          description: "FTP server connection test passed"
        });
      } else {
        toast({
          title: "Connection failed",
          description: data.error || "Unable to connect to FTP server",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const saveServer = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (server) {
        // Update existing server
        const { error } = await supabase
          .from('ftp_servers')
          .update(formData)
          .eq('id', server.id);

        if (error) throw error;
      } else {
        // Create new server
        const { error } = await supabase
          .from('ftp_servers')
          .insert([{
            ...formData,
            user_id: userData.user?.id
          }]);

        if (error) throw error;
      }

      toast({
        title: "Server saved",
        description: "FTP server configuration has been saved successfully"
      });

      fetchServer();
    } catch (error: any) {
      toast({
        title: "Failed to save server",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!server) return null;
    
    switch (server.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Server Configuration</h1>
        <p className="text-gray-600">Configure the FTP server connection</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              FTP Server Settings
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My FTP Server"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select 
                value={formData.protocol} 
                onValueChange={(value) => setFormData({ ...formData, protocol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ftp">FTP</SelectItem>
                  <SelectItem value="ftps">FTPS</SelectItem>
                  <SelectItem value="sftp">SFTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Hostname/IP</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="ftp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                min={1}
                max={65535}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="FTP username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="FTP password"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="passive"
              checked={formData.passive_mode}
              onCheckedChange={(checked) => setFormData({ ...formData, passive_mode: checked })}
            />
            <Label htmlFor="passive">Use Passive Mode</Label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  FTP credentials are encrypted and only accessible by administrators. 
                  Regular users cannot view or modify server settings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={testConnection} 
              disabled={testing || !formData.host || !formData.username}
              variant="outline"
              className="flex-1"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testing ? "Testing..." : "Test Connection"}
            </Button>
            <Button 
              onClick={saveServer} 
              disabled={saving || !formData.name || !formData.host}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {server && (
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {server.status === 'active' ? (
                  <Wifi className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="font-medium">Connection Status</p>
                  <p className="text-sm text-gray-600 capitalize">{server.status}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium">Last Connected</p>
                <p className="text-sm text-gray-600">
                  {server.last_connected 
                    ? new Date(server.last_connected).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
              
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(server.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServerManagement;