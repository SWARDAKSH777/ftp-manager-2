import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import FilesTab from '@/components/tabs/FilesTab';
import AdminPanel from '@/components/admin/AdminPanel';
import UserManagement from '@/components/admin/UserManagement';
import ServerManagement from '@/components/admin/ServerManagement';
import PermissionManagement from '@/components/admin/PermissionManagement';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Shield } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('files');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderActiveTab = () => {
    if (!userProfile?.is_active) {
      return (
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Pending Approval</h3>
              <p className="text-gray-600 text-center">
                Your account is waiting for admin approval. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case 'files':
        return <FilesTab />;
      case 'admin':
        return <AdminPanel />;
      case 'users':
        return <UserManagement />;
      case 'server':
        return <ServerManagement />;
      case 'permissions':
        return <PermissionManagement />;
      default:
        return <FilesTab />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userProfile={userProfile}
        className="md:w-64 w-full md:h-screen"
      />
      <main className="flex-1 overflow-auto">
        {userProfile?.role === 'admin' && (
          <div className="bg-blue-600 text-white p-2 text-center text-sm">
            <Shield className="inline h-4 w-4 mr-1" />
            Administrator Mode
          </div>
        )}
        {renderActiveTab()}
      </main>
    </div>
  );
};

export default Dashboard;