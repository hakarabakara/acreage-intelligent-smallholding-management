import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Save, Loader2, Plus, Edit, Trash2, Coins, MapPin, CloudSun, Share2 } from 'lucide-react';
import { useFarmStore } from '@/lib/farm-store';
import { toast } from 'sonner';
import type { Season } from '@shared/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserProfileCard } from '@/components/user/UserProfileCard';
import { DEFAULT_CURRENCIES } from '@/lib/constants';
export function GeneralSettings() {
  const settings = useFarmStore((state) => state.settings);
  const updateSettings = useFarmStore((state) => state.updateSettings);
  const isSettingsLoading = useFarmStore((state) => state.isLoading);
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('imperial');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [customCurrencies, setCustomCurrencies] = useState<{ code: string; symbol: string; name: string }[]>([]);
  // Location & Weather State
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [weatherProvider, setWeatherProvider] = useState<'open-meteo' | 'manual'>('open-meteo');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  // Dialog States
  const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false);
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  // Forms
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonForm, setSeasonForm] = useState<Partial<Season>>({
    name: '',
    startMonth: 1,
    endMonth: 3,
    color: '#10B981'
  });
  const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', name: '' });
  useEffect(() => {
    if (settings) {
      setFarmName(settings.name || '');
      setOwnerName(settings.ownerName || '');
      setLocation(settings.location || '');
      setCurrency(settings.currency || 'USD');
      setMeasurementSystem(settings.measurementSystem || 'imperial');
      setSeasons(settings.seasons || []);
      setCustomCurrencies(settings.customCurrencies || []);
      setCoordinates(settings.coordinates);
      setWeatherProvider(settings.weatherProvider || 'open-meteo');
    }
  }, [settings]);
  const availableCurrencies = useMemo(() => {
    return [...DEFAULT_CURRENCIES, ...customCurrencies];
  }, [customCurrencies]);
  const handleSaveFarmProfile = async () => {
    try {
      await updateSettings({
        name: farmName,
        ownerName: ownerName,
        location: location,
        currency: currency,
        measurementSystem: measurementSystem,
        seasons: seasons,
        customCurrencies: customCurrencies,
        coordinates: coordinates,
        weatherProvider: weatherProvider
      });
      toast.success('Farm settings updated successfully');
    } catch (error) {
      toast.error('Failed to update farm settings');
    }
  };
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('Location detected successfully');
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Location detection failed', error);
        toast.error('Failed to detect location. Please enter manually.');
        setIsDetectingLocation(false);
      }
    );
  };
  const handleShareLocation = () => {
    if (!coordinates?.lat || !coordinates?.lng) {
      toast.error('Please set coordinates first');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    navigator.clipboard.writeText(url);
    toast.success('Google Maps link copied to clipboard');
  };
  // Season Handlers
  const openSeasonDialog = (season?: Season) => {
    if (season) {
      setEditingSeason(season);
      setSeasonForm(season);
    } else {
      setEditingSeason(null);
      setSeasonForm({
        name: '',
        startMonth: 1,
        endMonth: 3,
        color: '#10B981'
      });
    }
    setIsSeasonDialogOpen(true);
  };
  const handleSaveSeason = async () => {
    if (!seasonForm.name) return;
    const newSeason = {
      id: editingSeason?.id || crypto.randomUUID(),
      name: seasonForm.name,
      startMonth: Number(seasonForm.startMonth),
      endMonth: Number(seasonForm.endMonth),
      color: seasonForm.color || '#10B981'
    } as Season;
    const updatedSeasons = editingSeason
      ? seasons.map(s => s.id === newSeason.id ? newSeason : s)
      : [...seasons, newSeason];
    setSeasons(updatedSeasons);
    setIsSeasonDialogOpen(false);
  };
  const handleDeleteSeason = (id: string) => {
    setSeasons(prev => prev.filter(s => s.id !== id));
  };
  // Currency Handlers
  const handleAddCurrency = () => {
    if (!newCurrency.code || !newCurrency.symbol) return;
    const code = newCurrency.code.toUpperCase().trim();
    if (availableCurrencies.some(c => c.code === code)) {
      toast.error('Currency code already exists');
      return;
    }
    setCustomCurrencies(prev => [...prev, { ...newCurrency, code }]);
    setNewCurrency({ code: '', symbol: '', name: '' });
    toast.success('Currency added');
  };
  const handleDeleteCurrency = (code: string) => {
    if (code === currency) {
      toast.error('Cannot delete currently selected currency');
      return;
    }
    setCustomCurrencies(prev => prev.filter(c => c.code !== code));
  };
  return (
    <div className="space-y-8">
      <UserProfileCard />
      <Card>
        <CardHeader>
          <CardTitle>Farm Profile</CardTitle>
          <CardDescription>Manage your farm's identity and global preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="farmName">Farm Name</Label>
            <Input
              id="farmName"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. Green Valley Farm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location (Text)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. California, USA"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currency">Currency</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-emerald-600"
                  onClick={() => setIsCurrencyDialogOpen(true)}
                >
                  Manage Currencies
                </Button>
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="measurement">Measurement System</Label>
              <Select value={measurementSystem} onValueChange={(v: any) => setMeasurementSystem(v)}>
                <SelectTrigger id="measurement">
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Imperial (Acres, lbs)</SelectItem>
                  <SelectItem value="metric">Metric (Hectares, kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button onClick={handleSaveFarmProfile} disabled={isSettingsLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSettingsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location & Weather
          </CardTitle>
          <CardDescription>Configure coordinates for accurate weather forecasting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input 
                type="number" 
                value={coordinates?.lat || ''} 
                onChange={(e) => setCoordinates(prev => ({ ...prev!, lat: parseFloat(e.target.value) }))}
                placeholder="0.000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input 
                type="number" 
                value={coordinates?.lng || ''} 
                onChange={(e) => setCoordinates(prev => ({ ...prev!, lng: parseFloat(e.target.value) }))}
                placeholder="0.000000"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDetectLocation} disabled={isDetectingLocation}>
                {isDetectingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                Detect Location
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareLocation} disabled={!coordinates?.lat}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Map Link
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="weatherProvider" className="text-sm text-muted-foreground">Weather Provider:</Label>
              <Select value={weatherProvider} onValueChange={(v: any) => setWeatherProvider(v)}>
                <SelectTrigger id="weatherProvider" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open-meteo">Open-Meteo (Free)</SelectItem>
                  <SelectItem value="manual">Manual Entry Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900 flex items-start gap-3">
            <CloudSun className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Accurate coordinates enable precise weather forecasts for your specific farm location. 
              We use Open-Meteo for free, high-resolution weather data.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Season Configuration</CardTitle>
            <CardDescription>Define growing seasons for your region.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openSeasonDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Season
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {seasons.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              No seasons defined. Add seasons to organize your budget and crops.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {seasons.map(season => (
                <div key={season.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: season.color }} />
                    <div>
                      <div className="font-medium">{season.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Month {season.startMonth} - {season.endMonth}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openSeasonDialog(season)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSeason(season.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Season Dialog */}
      <Dialog open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit Season' : 'New Season'}</DialogTitle>
            <DialogDescription>Define a seasonal period for your farm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Season Name</Label>
              <Input
                placeholder="e.g. Monsoon"
                value={seasonForm.name}
                onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Month</Label>
                <Select
                  value={seasonForm.startMonth?.toString()}
                  onValueChange={(v) => setSeasonForm({ ...seasonForm, startMonth: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>{format(new Date(2024, m - 1, 1), 'MMMM')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Month</Label>
                <Select
                  value={seasonForm.endMonth?.toString()}
                  onValueChange={(v) => setSeasonForm({ ...seasonForm, endMonth: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>{format(new Date(2024, m - 1, 1), 'MMMM')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {['#10B981', '#F59E0B', '#F97316', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      seasonForm.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSeasonForm({ ...seasonForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeasonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSeason} disabled={!seasonForm.name}>Save Season</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Currency Management Dialog */}
      <Dialog open={isCurrencyDialogOpen} onOpenChange={setIsCurrencyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              Manage Currencies
            </DialogTitle>
            <DialogDescription>Add custom currencies for your financial records.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
              <h4 className="text-sm font-medium">Add New Currency</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Input
                    placeholder="Code (e.g. KES)"
                    value={newCurrency.code}
                    onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value})}
                    maxLength={3}
                    className="uppercase"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    placeholder="Symbol (e.g. KSh)"
                    value={newCurrency.symbol}
                    onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                  />
                </div>
                <div className="col-span-1">
                  <Button onClick={handleAddCurrency} disabled={!newCurrency.code || !newCurrency.symbol} className="w-full">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Name (e.g. Kenyan Shilling)"
                value={newCurrency.name}
                onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Currencies</Label>
              {customCurrencies.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No custom currencies added.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {customCurrencies.map(c => (
                    <div key={c.code} className="flex items-center justify-between p-2 bg-card border rounded text-sm">
                      <div>
                        <span className="font-bold">{c.code}</span> ({c.symbol}) - {c.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDeleteCurrency(c.code)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCurrencyDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}