import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { AREAS } from '../utils/constants';
import { formatRating } from '../utils/formatters';

export default function ProfilePage() {
  const { user, requireAuth, refreshUser, showToast } = useApp();
  const [profileData, setProfileData] = useState({ name: '', area: 'Adyar' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        area: user.area in AREAS ? user.area : 'Adyar'
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8">
        <span className="text-4xl mb-3">👤</span>
        <h2 className="text-xl font-bold text-[#232826]">Log In to View Profile</h2>
        <p className="mt-1 text-xs text-mute max-w-sm">
          Manage your personal details, default neighbourhood, and member credentials.
        </p>
        <Button onClick={requireAuth} className="mt-4">
          Log In
        </Button>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMe(profileData);
      await refreshUser();
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-6 max-w-lg mx-auto">
      <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-line">
          <img
            src={user.avatar}
            alt=""
            className="h-16 w-16 rounded-3xl object-cover border border-stone-200"
          />
          <div>
            <h1 className="text-xl font-black text-[#232826]">{user.name}</h1>
            <p className="text-xs text-mute">{user.email}</p>
            <p className="text-xs font-semibold text-forest mt-0.5">
              Rating: {formatRating(user.rating, user.reviewCount)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <Input
            id="prof-name"
            label="Display Name"
            required
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="prof-area" className="text-xs font-semibold uppercase tracking-wider text-mute">
              Default Neighbourhood
            </label>
            <select
              id="prof-area"
              value={profileData.area}
              onChange={(e) => setProfileData({ ...profileData, area: e.target.value })}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] focus:border-forest focus:outline-none"
            >
              {Object.keys(AREAS).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
