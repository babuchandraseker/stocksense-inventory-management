import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Mail,
  UserCheck,
  Building,
  Key,
  Save,
  LogOut,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Karthik');
  const [email, setEmail] = useState(user?.email || 'staff@stocksense.com');
  const [warehouse, setWarehouse] = useState(user?.warehouseName || 'Central Logistics Hub');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Staff details and preferences successfully saved.',
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast({ type: 'error', title: 'Error', message: 'Current password is required.' });
      return;
    }
    showToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Your security password was updated successfully.',
    });
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Staff Profile"
        subtitle="Warehouse operational associate profile, facility assignment, and shift details."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <Card className="text-center flex flex-col items-center p-6">
          <div className="relative mb-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-600/30 shadow-warm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-primary text-white flex items-center justify-center text-3xl font-bold">
                {name[0]}
              </div>
            )}
            <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <h3 className="text-lg font-bold text-brand-textDark">{name}</h3>
          <p className="text-xs text-brand-textMuted mt-0.5">{email}</p>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Badge variant="success" size="sm">
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Warehouse Staff
            </Badge>
            <Badge variant="neutral" size="sm">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Day Shift (08:00 - 17:00)
            </Badge>
          </div>

          <div className="mt-6 pt-6 border-t border-brand-border w-full text-left text-xs space-y-2.5 text-brand-textMedium">
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Assigned Hub:</span>
              <span className="font-semibold text-brand-textDark">{warehouse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Operational Role:</span>
              <span className="font-semibold text-brand-textDark">Inventory & Receiving</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-textMuted">Status:</span>
              <span className="text-emerald-700 font-bold">On Duty</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4 text-red-500" />}
              className="text-red-700 hover:bg-red-50 border-red-200"
            >
              Sign Out of Session
            </Button>
          </div>
        </Card>

        {/* Edit Information & Password */}
        <div className="md:col-span-2 space-y-6">
          <Card
            header={
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-caramel" />
                <h4 className="font-bold text-sm text-brand-textDark">Staff Information</h4>
              </div>
            }
          >
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Warehouse Assignment"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card
            header={
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-caramel" />
                <h4 className="font-bold text-sm text-brand-textDark">Change Password</h4>
              </div>
            }
          >
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="Current Password"
                isPassword
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Input
                label="New Password"
                isPassword
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
