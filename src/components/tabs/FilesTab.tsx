import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw,
  ArrowLeft,
  FolderPlus,
  AlertCircle,
  Wifi,
  Lock
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface FtpFile {
  name: string;
  size: number;
  type: 'file' | 'directory';
  modified_at: string;
  path: string;
  permissions?: string;
}

const FilesTab = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FtpFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [server, setServer] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchServerAndPermissions();
  }, []);

  useEffect(() => {
    if (server && hasPathPermission(currentPath, 'read')) {
      fetchFiles();
    }
  }, [currentPath, server, userPermissions]);

  const fetchServerAndPermissions = async () => {
    try {
      // Get the single FTP server
      const { data: serverData, error: serverError } = await supabase
        .from('ftp_servers')
        .select('*')
        .limit(1)
        .single();

      if (serverError) throw serverError;
      setServer(serverData);

      // Get user permissions
      const { data: permissionsData, error: permError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('server_id', serverData.id);

      if (permError) throw permError;
      setUserPermissions(permissionsData || []);
    } catch (error: any) {
      console.error('Error fetching server/permissions:', error);
      toast({
        title: "Access Error",
        description: "Unable to load server configuration",
        variant: "destructive"
      });
    }
  };

  const hasPathPermission = (path: string, action: 'read' | 'write' | 'delete'): boolean => {
    if (!userPermissions.length) return false;
    
    // Check for exact path match or parent path permissions
    return userPermissions.some(perm => {
      const permPath = perm.path.endsWith('/') ? perm.path.slice(0, -1) : perm.path;
      const checkPath = path.endsWith('/') ? path.slice(0, -1) : path;
      
      const hasAccess = checkPath.startsWith(permPath) || permPath === '*';
      
      switch (action) {
        case 'read':
          return hasAccess && perm.can_read;
        case 'write':
          return hasAccess && perm.can_write;
        case 'delete':
          return hasAccess && perm.can_delete;
        default:
          return false;
      }
    });
  };

  const fetchFiles = async () => {
    if (!server || !hasPathPermission(currentPath, 'read')) {
      setFiles([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ftp-operations', {
        body: {
          action: 'list_files',
          serverId: server.id,
          path: currentPath
        }
      });

      if (error) throw error;

      if (data.success) {
        // Filter files based on user permissions
        const filteredFiles = data.files.filter((file: FtpFile) => {
          return hasPathPermission(file.path, 'read');
        });
        
        setFiles(filteredFiles);
        
        toast({
          title: "Files loaded",
          description: `Found ${filteredFiles.length} accessible items`
        });
      } else {
        throw new Error(data.error || 'Failed to list files');
      }
    } catch (error: any) {
      console.error('Failed to fetch files:', error);
      toast({
        title: "Failed to load files",
        description: error.message,
        variant: "destructive"
      });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FtpFile) => {
    if (file.type === 'directory') {
      if (file.name === '..') {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
      } else {
        setCurrentPath(file.path);
      }
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !server || !hasPathPermission(currentPath, 'write')) {
      toast({
        title: "Upload not allowed",
        description: "You don't have write permission for this location",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as ArrayBuffer;
          const remotePath = `${currentPath}/${file.name}`.replace('//', '/');

          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 200);

          const { data, error } = await supabase.functions.invoke('ftp-operations', {
            body: {
              action: 'upload_file',
              serverId: server.id,
              fileData: {
                fileName: file.name,
                size: file.size,
                localPath: file.name,
                remotePath: remotePath,
                content: btoa(String.fromCharCode(...new Uint8Array(content)))
              }
            }
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (error) throw error;

          if (data.success) {
            toast({
              title: "Upload successful",
              description: `${file.name} has been uploaded`
            });
            fetchFiles();
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (uploadError: any) {
          toast({
            title: "Upload failed",
            description: uploadError.message,
            variant: "destructive"
          });
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file: FtpFile) => {
    if (!server || file.type === 'directory') return;

    setDownloadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const { data, error } = await supabase.functions.invoke('ftp-operations', {
        body: {
          action: 'download_file',
          serverId: server.id,
          path: file.path
        }
      });

      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (error) throw error;

      if (data.success && data.content) {
        const content = atob(data.content);
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Download complete",
          description: `${file.name} has been downloaded`
        });
      } else {
        throw new Error(data.error || 'Download failed');
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  const handleDelete = async (file: FtpFile) => {
    if (!server || !hasPathPermission(file.path, 'delete')) {
      toast({
        title: "Delete not allowed",
        description: "You don't have delete permission for this item",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('ftp-operations', {
        body: {
          action: 'delete_file',
          serverId: server.id,
          path: file.path
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "File deleted",
          description: `${file.name} has been deleted`
        });
        fetchFiles();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderBreadcrumb = () => {
    const pathParts = currentPath.split('/').filter(part => part);
    
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => setCurrentPath('/')}
              className="cursor-pointer"
            >
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === pathParts.length - 1 ? (
                  <BreadcrumbPage>{part}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    onClick={() => setCurrentPath('/' + pathParts.slice(0, index + 1).join('/'))}
                    className="cursor-pointer"
                  >
                    {part}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  if (!server) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Server Configured</h3>
            <p className="text-gray-600">Contact your administrator to set up the FTP server</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPathPermission(currentPath, 'read')) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="text-center py-12">
            <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this location</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Files</h1>
          <p className="text-sm text-gray-600">Browse your accessible files</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPathPermission(currentPath, 'write') && (
            <label>
              <Button
                variant="outline"
                disabled={uploading || loading}
                asChild
                size="sm"
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </span>
              </Button>
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading || loading}
              />
            </label>
          )}
          <Button
            variant="outline"
            onClick={fetchFiles}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Bars */}
      {uploadProgress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {downloadProgress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Downloading...</span>
                <span>{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center text-lg">
              <Folder className="mr-2 h-5 w-5" />
              {server.name}
            </CardTitle>
            {renderBreadcrumb()}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Found</h3>
              <p className="text-gray-600">This directory is empty or you don't have access</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {file.type === 'directory' ? (
                      <Folder className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.modified_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {file.type === 'file' && file.name !== '..' && (
                    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {hasPathPermission(file.path, 'delete') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilesTab;