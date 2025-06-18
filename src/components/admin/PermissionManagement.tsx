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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Plus, Trash2, User, Folder, Shield } from 'lucide-react';

const PermissionManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPermission, setNewPermission] = useState({
    user_id: '',
    path: '/',
    can_read: true,
    can_write: false,
    can_delete: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get server
      const { data: serverData } = await supabase
        .from('ftp_servers')
        .select('*')
        .limit(1)
        .single();

      setServer(serverData);

      // Get users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      setUsers(usersData || []);

      // Get permissions
      if (serverData) {
        const { data: permissionsData } = await supabase
          .from('user_permissions')
          .select(`
            *,
            user_profiles!inner(username, display_name)
          `)
          .eq('server_id', serverData.id)
          .order('path');

        setPermissions(permissionsData || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Failed to load data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPermission = async () => {
    if (!server || !newPermission.user_id || !newPermission.path) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_permissions')
        .insert([{
          ...newPermission,
          server_id: server.id,
          created_by: userData.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Permission added",
        description: "User permission has been created successfully"
      });

      setShowAddDialog(false);
      setNewPermission({
        user_id: '',
        path: '/',
        can_read: true,
        can_write: false,
        can_delete: false
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to add permission",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updatePermission = async (permissionId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update(updates)
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: "Permission updated",
        description: "User permission has been updated successfully"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to update permission",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: "Permission deleted",
        description: "User permission has been removed"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Failed to delete permission",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPermissionBadges = (permission: any) => {
    const badges = [];
    if (permission.can_read) badges.push(<Badge key="read" variant="default">Read</Badge>);
    if (permission.can_write) badges.push(<Badge key="write" variant="secondary">Write</Badge>);
    if (permission.can_delete) badges.push(<Badge key="delete" variant="destructive">Delete</Badge>);
    return badges;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Server Configured</h3>
            <p className="text-gray-600">Configure an FTP server first to manage permissions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600">Control user access to files and folders</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Permission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={newPermission.user_id} onValueChange={(value) => setNewPermission({ ...newPermission, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="path">Path</Label>
                <Input
                  id="path"
                  value={newPermission.path}
                  onChange={(e) => setNewPermission({ ...newPermission, path: e.target.value })}
                  placeholder="/path/to/folder or * for all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use * for all paths, or specify a folder path like /documents
                </p>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_read"
                      checked={newPermission.can_read}
                      onCheckedChange={(checked) => setNewPermission({ ...newPermission, can_read: checked })}
                    />
                    <Label htmlFor="can_read">Read (view files and folders)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_write"
                      checked={newPermission.can_write}
                      onCheckedChange={(checked) => setNewPermission({ ...newPermission, can_write: checked })}
                    />
                    <Label htmlFor="can_write">Write (upload files)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_delete"
                      checked={newPermission.can_delete}
                      onCheckedChange={(checked) => setNewPermission({ ...newPermission, can_delete: checked })}
                    />
                    <Label htmlFor="can_delete">Delete (remove files)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addPermission}>
                  Add Permission
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            User Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions set</h3>
              <p className="text-gray-600">Add permissions to control user access to files and folders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <User className="h-8 w-8 text-gray-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{permission.user_profiles.display_name}</h3>
                        <span className="text-sm text-gray-500">@{permission.user_profiles.username}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Folder className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{permission.path}</span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        {getPermissionBadges(permission)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-1">
                        <Switch
                          checked={permission.can_read}
                          onCheckedChange={(checked) => updatePermission(permission.id, { can_read: checked })}
                          size="sm"
                        />
                        <span className="text-xs">Read</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Switch
                          checked={permission.can_write}
                          onCheckedChange={(checked) => updatePermission(permission.id, { can_write: checked })}
                          size="sm"
                        />
                        <span className="text-xs">Write</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Switch
                          checked={permission.can_delete}
                          onCheckedChange={(checked) => updatePermission(permission.id, { can_delete: checked })}
                          size="sm"
                        />
                        <span className="text-xs">Delete</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePermission(permission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManagement;