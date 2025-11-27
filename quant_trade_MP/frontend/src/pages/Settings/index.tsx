import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/loaders/Loader';
import { ErrorDisplay } from '@/components/loaders/ErrorDisplay';
import { useUser, useUpdateUser } from '@/hooks/useApi';
import { User as UserIcon, Save, X } from 'lucide-react';

export default function Settings() {
  const { data: user, isLoading, error } = useUser();
  const updateUserMutation = useUpdateUser();
  const [successMessage, setSuccessMessage] = useState(false);

  const userConfig = (user as any)?.config;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    drawdown_limit: user?.drawdown_limit ? (user.drawdown_limit * 100).toString() : '25',
    max_assets: user?.max_assets?.toString() || '15',
    default_sparsity: userConfig?.default_sparsity?.toString() || '15',
    max_position_size: userConfig?.max_position_size ? (userConfig.max_position_size * 100).toString() : '25',
  });

  useEffect(() => {
    if (user) {
      const cfg = (user as any)?.config;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        drawdown_limit: user.drawdown_limit ? (user.drawdown_limit * 100).toString() : '25',
        max_assets: user.max_assets?.toString() || '15',
        default_sparsity: cfg?.default_sparsity?.toString() || '15',
        max_position_size: cfg?.max_position_size ? (cfg.max_position_size * 100).toString() : '25',
      });
    }
  }, [user]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (updateUserMutation.isSuccess) {
      setSuccessMessage(true);
      const timer = setTimeout(() => setSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateUserMutation.isSuccess]);

  const handleSave = async () => {
    const payload: any = {
      name: formData.name,
      email: formData.email,
      drawdown_limit: parseFloat(formData.drawdown_limit) / 100,
      max_assets: parseInt(formData.max_assets),
      config: {
        default_sparsity: parseInt(formData.default_sparsity),
        max_position_size: parseFloat(formData.max_position_size) / 100,
      },
    };

    await updateUserMutation.mutateAsync(payload);
  };

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorDisplay message="Failed to load user settings" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and risk preferences</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Tolerance */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Tolerance</CardTitle>
          <CardDescription>Configure your portfolio risk limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="drawdownLimit">Max Drawdown Limit (%)</Label>
            <Input
              id="drawdownLimit"
              type="number"
              step="1"
              value={formData.drawdown_limit}
              onChange={(e) => setFormData({ ...formData, drawdown_limit: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Portfolio will trigger risk alert when drawdown exceeds this threshold
            </p>
          </div>
          <div>
            <Label htmlFor="maxAssets">Max Assets in Portfolio</Label>
            <Input
              id="maxAssets"
              type="number"
              value={formData.max_assets}
              onChange={(e) => setFormData({ ...formData, max_assets: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Maximum number of assets to hold simultaneously (sparsity constraint)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Default Portfolio Settings</CardTitle>
          <CardDescription>Preset values for portfolio construction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultSparsity">Default Sparsity K</Label>
            <Input 
              id="defaultSparsity" 
              type="number" 
              value={formData.default_sparsity}
              onChange={(e) => setFormData({ ...formData, default_sparsity: e.target.value })}
              min="1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Maximum number of assets to include in portfolio construction
            </p>
          </div>
            <div>
              <Label htmlFor="defaultMaxWeight">Max Position Size (%)</Label>
              <Input 
                id="defaultMaxWeight" 
                type="number" 
                step="0.1"
                value={formData.max_position_size}
                onChange={(e) => setFormData({ ...formData, max_position_size: e.target.value })}
                min="0"
                max="100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum weight per position in portfolio (0-100%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {successMessage && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6 flex justify-between items-center">
            <p className="text-green-800 dark:text-green-200">Settings saved successfully!</p>
            <button 
              onClick={() => setSuccessMessage(false)}
              className="text-green-600 dark:text-green-400 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
