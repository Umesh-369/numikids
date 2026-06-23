'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../../lib/store';
import { useAudio } from '../../../lib/useAudio';
import { apiFetch } from '../../../lib/api';
import { AVATAR_SHOP_ITEMS } from 'shared';

// SVG Avatar Composition Renderer
interface AvatarConfigProps {
  skin: string;
  hair: string;
  eyes: string;
  mouth: string;
  accessory: string;
  background: string;
}

function AvatarSVG({ skin, hair, eyes, mouth, accessory, background }: AvatarConfigProps) {
  // Config mapping
  const colors: Record<string, string> = {
    // Skins
    'peach': '#FDBA74',
    'cocoa': '#78350F',
    'almond': '#F59E0B',
    'olive': '#A1A1AA',
    // Backgrounds
    'soft-yellow': '#FEF08A',
    'sky-blue': '#BAE6FD',
    'galaxy': '#1E1B4B',
    'jungle': '#A7F3D0',
    'rainbow': '#FDE047',
    'castle': '#FBCFE8'
  };

  const bgFill = colors[background] || '#FEF08A';
  const skinFill = colors[skin] || '#FDBA74';

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full rounded-full shadow-inner border-4 border-white">
      {/* Background Layer */}
      <circle cx="100" cy="100" r="100" fill={bgFill} />

      {/* Galaxy Stars / Jungle Leaves fallbacks if special bg */}
      {background === 'galaxy' && (
        <>
          <circle cx="40" cy="50" r="2" fill="white" opacity="0.8" />
          <circle cx="150" cy="40" r="3" fill="white" opacity="0.6" />
          <circle cx="160" cy="120" r="2" fill="white" opacity="0.8" />
          <circle cx="60" cy="150" r="1" fill="white" opacity="0.4" />
        </>
      )}

      {/* Body/Shoulders */}
      <path d="M40 180 C40 140, 160 140, 160 180 Z" fill="#FF6B6B" />

      {/* Head */}
      <circle cx="100" cy="100" r="45" fill={skinFill} />

      {/* Ears */}
      <circle cx="50" cy="100" r="8" fill={skinFill} />
      <circle cx="150" cy="100" r="8" fill={skinFill} />

      {/* Eyes Layer */}
      {eyes === 'happy' && (
        <>
          <path d="M80 95 Q85 88 90 95" stroke="#2D2D2D" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M110 95 Q115 88 120 95" stroke="#2D2D2D" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyes === 'wink' && (
        <>
          <path d="M80 95 Q85 88 90 95" stroke="#2D2D2D" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="110" y1="92" x2="120" y2="92" stroke="#2D2D2D" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {eyes === 'glasses' && (
        <>
          <circle cx="82" cy="95" r="10" stroke="#000000" strokeWidth="3" fill="none" />
          <circle cx="118" cy="95" r="10" stroke="#000000" strokeWidth="3" fill="none" />
          <line x1="92" y1="95" x2="108" y2="95" stroke="#000000" strokeWidth="3" />
        </>
      )}
      {eyes === 'sparkle' && (
        <>
          <circle cx="82" cy="95" r="5" fill="#2D2D2D" />
          <circle cx="118" cy="95" r="5" fill="#2D2D2D" />
          <polygon points="82,88 84,91 87,91 85,93 86,96 82,94 78,96 79,93 77,91 80,91" fill="white" />
          <polygon points="118,88 120,91 123,91 121,93 122,96 118,94 114,96 115,93 113,91 116,91" fill="white" />
        </>
      )}

      {/* Mouth Layer */}
      {mouth === 'smile' && (
        <path d="M90 115 Q100 125 110 115" stroke="#2D2D2D" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {mouth === 'laughing' && (
        <path d="M88 115 Q100 135 112 115 Z" fill="#2D2D2D" />
      )}
      {mouth === 'bubblegum' && (
        <circle cx="100" cy="115" r="10" fill="#FF8DA1" stroke="#FF5C7A" strokeWidth="2" />
      )}
      {mouth === 'tongue' && (
        <>
          <path d="M90 112 Q100 122 110 112" stroke="#2D2D2D" strokeWidth="4" fill="none" />
          <path d="M94 116 Q100 128 106 116 Z" fill="#FF5C7A" />
        </>
      )}

      {/* Hair Layer */}
      {hair === 'curly-brown' && (
        <path d="M60 80 C50 60, 150 60, 140 80 C150 90, 130 90, 130 80 C110 70, 90 70, 70 80 Z" fill="#5C4033" />
      )}
      {hair === 'spiky-blue' && (
        <polygon points="50,80 60,40 75,60 90,30 105,60 120,30 135,60 150,80 100,75" fill="#3B82F6" />
      )}
      {hair === 'straight-yellow' && (
        <path d="M55 75 Q100 50 145 75 L145 105 Q145 75 125 80 Q100 70 75 80 Q55 75 55 105 Z" fill="#FBBF24" />
      )}
      {hair === 'tiara' && (
        <>
          <path d="M60 80 C50 60, 150 60, 140 80 Z" fill="#FBBF24" />
          <polygon points="75,70 85,45 100,35 115,45 125,70" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="100" cy="35" r="4" fill="#E11D48" />
        </>
      )}

      {/* Accessories Layer */}
      {accessory === 'wand' && (
        <g transform="translate(130, 110) rotate(-20)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="#78350F" strokeWidth="4" />
          <polygon points="0,-12 4,-3 12,-3 6,3 8,12 0,6 -8,12 -6,3 -12,-3 -4,-3" fill="#FDE047" />
        </g>
      )}
      {accessory === 'mask' && (
        <path d="M65 95 C65 85, 135 85, 135 95 C125 102, 75 102, 65 95 Z" fill="#EF4444" />
      )}
      {accessory === 'wizard' && (
        <polygon points="55,68 100,10 145,68" fill="#4F46E5" stroke="#818CF8" strokeWidth="3" />
      )}

    </svg>
  );
}

export default function ProfilePage() {
  const { playClick, playSuccess, playWrong, playCoin } = useAudio();
  const { childProfile, updateChildProfile } = useAppStore();

  const [activeTab, setActiveTab] = useState<'avatar' | 'badges' | 'shop'>('avatar');
  const [badges, setBadges] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Selected Avatar Customizer state
  const [currentConfig, setCurrentConfig] = useState<AvatarConfigProps>({
    skin: 'peach',
    hair: 'curly-brown',
    eyes: 'happy',
    mouth: 'smile',
    accessory: 'none',
    background: 'soft-yellow'
  });

  useEffect(() => {
    if (childProfile) {
      setCurrentConfig(childProfile.avatarConfig);
      fetchBadges();
    }
  }, [childProfile]);

  const fetchBadges = async () => {
    const res = await apiFetch(`/badges/${childProfile?._id}`);
    if (res.success && res.data) {
      setBadges(res.data);
    }
  };

  const handleSelectOption = (category: keyof AvatarConfigProps, value: string) => {
    const itemId = `${category}-${value}`;
    
    // Check if unlocked
    if (value !== 'none' && !childProfile?.unlockedAvatarItems.includes(itemId)) {
      playWrong();
      setError(`Item is locked! Purchase it in the Avatar Shop tab first.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    playClick();
    setCurrentConfig(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSaveAvatar = async () => {
    playClick();
    const res = await apiFetch(`/children/${childProfile?._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarConfig: currentConfig })
    });

    if (res.success) {
      playSuccess();
      updateChildProfile({ avatarConfig: currentConfig });
      alert('Avatar configuration saved! 🦉');
    } else {
      playWrong();
      alert('Failed to save avatar settings.');
    }
  };

  const handlePurchaseItem = async (itemId: string) => {
    playClick();
    const res = await apiFetch('/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({
        childId: childProfile?._id,
        itemId: itemId
      })
    });

    if (res.success && res.data) {
      playSuccess();
      // Update local wallet and unlocked items list
      updateChildProfile({
        coins: res.data.coinsRemaining,
        unlockedAvatarItems: res.data.unlockedAvatarItems
      });
      alert('Item purchased successfully! You can equip it now.');
    } else {
      playWrong();
      alert(res.error || 'Failed to purchase item.');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-8 font-child items-start select-none">
      
      {/* Left Column: Avatar Preview */}
      <div className="w-full md:w-80 flex flex-col items-center bg-brand-surface border-4 border-brand-muted/10 rounded-card p-6 shadow-card">
        <h3 className="text-xl font-black text-brand-text mb-4">Avatar Preview</h3>
        
        <div className="w-48 h-48 mb-6">
          <AvatarSVG {...currentConfig} />
        </div>

        <button
          onClick={handleSaveAvatar}
          className="w-full py-3.5 bg-brand-primary text-white font-black text-lg rounded-btn shadow hover:opacity-90 transition min-h-[56px]"
        >
          Save Avatar 💾
        </button>

        {error && (
          <p className="text-red-500 text-xs font-bold text-center mt-3 animate-pulse">{error}</p>
        )}
      </div>

      {/* Right Column: Customizer Selector Tab Panel */}
      <div className="flex-1 w-full bg-brand-surface border-4 border-brand-muted/10 rounded-card p-6 shadow-card">
        
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-brand-muted/10 pb-3 mb-6 gap-2">
          <button
            onClick={() => { playClick(); setActiveTab('avatar'); }}
            className={`px-5 py-2.5 font-black text-lg rounded-btn border-2 transition ${
              activeTab === 'avatar' 
                ? 'bg-brand-secondary border-brand-secondary text-white' 
                : 'bg-brand-surface border-transparent text-brand-text hover:bg-slate-50'
            } min-h-[48px]`}
          >
            🎨 Dress Numi
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('badges'); }}
            className={`px-5 py-2.5 font-black text-lg rounded-btn border-2 transition ${
              activeTab === 'badges' 
                ? 'bg-brand-secondary border-brand-secondary text-white' 
                : 'bg-brand-surface border-transparent text-brand-text hover:bg-slate-50'
            } min-h-[48px]`}
          >
            🏆 Badge Chest
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('shop'); }}
            className={`px-5 py-2.5 font-black text-lg rounded-btn border-2 transition ${
              activeTab === 'shop' 
                ? 'bg-brand-secondary border-brand-secondary text-white' 
                : 'bg-brand-surface border-transparent text-brand-text hover:bg-slate-50'
            } min-h-[48px]`}
          >
            🛍️ Coin Shop
          </button>
        </div>

        {/* Tab content 1: Avatar builder editor */}
        {activeTab === 'avatar' && (
          <div className="flex flex-col gap-5">
            {/* Category: Skin */}
            <div>
              <h4 className="font-bold text-brand-text mb-2 text-sm">Skin color</h4>
              <div className="flex gap-3">
                {['peach', 'cocoa', 'almond', 'olive'].map(skin => (
                  <button
                    key={skin}
                    onClick={() => handleSelectOption('skin', skin)}
                    className={`px-4 py-2 border-2 rounded-btn font-bold capitalize min-h-[48px] ${
                      currentConfig.skin === skin ? 'border-brand-primary bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    {skin}
                  </button>
                ))}
              </div>
            </div>

            {/* Category: Hair */}
            <div>
              <h4 className="font-bold text-brand-text mb-2 text-sm">Hair Style</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'curly-brown', name: 'Curly Brown' },
                  { id: 'spiky-blue', name: 'Spiky Blue 🔒' },
                  { id: 'straight-yellow', name: 'Straight Yellow' },
                  { id: 'tiara', name: 'Tiara 🔒' }
                ].map(hair => (
                  <button
                    key={hair.id}
                    onClick={() => handleSelectOption('hair', hair.id)}
                    className={`px-4 py-2 border-2 rounded-btn font-bold min-h-[48px] ${
                      currentConfig.hair === hair.id ? 'border-brand-primary bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    {hair.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category: Eyes */}
            <div>
              <h4 className="font-bold text-brand-text mb-2 text-sm">Eyes shape</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'happy', name: 'Happy' },
                  { id: 'wink', name: 'Wink' },
                  { id: 'glasses', name: 'Glasses 🔒' },
                  { id: 'sparkle', name: 'Sparkle' }
                ].map(eyes => (
                  <button
                    key={eyes.id}
                    onClick={() => handleSelectOption('eyes', eyes.id)}
                    className={`px-4 py-2 border-2 rounded-btn font-bold min-h-[48px] ${
                      currentConfig.eyes === eyes.id ? 'border-brand-primary bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    {eyes.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category: Backgrounds */}
            <div>
              <h4 className="font-bold text-brand-text mb-2 text-sm">Island Wallpaper</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'soft-yellow', name: 'Soft Yellow' },
                  { id: 'sky-blue', name: 'Sky Blue' },
                  { id: 'galaxy', name: 'Space Galaxy 🔒' },
                  { id: 'jungle', name: 'Dino Jungle 🔒' }
                ].map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => handleSelectOption('background', bg.id)}
                    className={`px-4 py-2 border-2 rounded-btn font-bold min-h-[48px] ${
                      currentConfig.background === bg.id ? 'border-brand-primary bg-amber-50' : 'border-slate-200'
                    }`}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab content 2: Badges lists */}
        {activeTab === 'badges' && (
          <div>
            <h4 className="font-black text-brand-text text-lg mb-4">Your Achievements</h4>
            {badges.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-5xl block">📦</span>
                <p className="text-brand-muted mt-2 font-parent">Your chest is empty! Play more lessons to win medals and badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge._id} className="p-4 border-2 border-brand-warning bg-amber-50/50 rounded-card text-center flex flex-col items-center">
                    <span className="text-4xl block mb-2">⭐</span>
                    <h5 className="font-black text-brand-text text-sm">{badge.name}</h5>
                    <p className="text-[10px] text-brand-muted font-parent mt-1 leading-normal">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content 3: Avatar Shop */}
        {activeTab === 'shop' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-brand-text text-lg">Avatar Accessory Shop</h4>
              <div className="bg-brand-background border py-1.5 px-4 rounded-full font-black text-brand-text flex items-center gap-1">
                <span>Wallet: 🪙 {childProfile?.coins}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(AVATAR_SHOP_ITEMS).map(([itemId, item]) => {
                const isUnlocked = childProfile?.unlockedAvatarItems.includes(itemId);
                return (
                  <div
                    key={itemId}
                    className={`p-4 border-2 rounded-card flex justify-between items-center shadow-sm ${
                      isUnlocked ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-brand-muted/10 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h5 className="font-black text-brand-text text-base capitalize">{item.name}</h5>
                      <p className="text-xs text-brand-muted capitalize font-parent mt-0.5">Category: {item.category}</p>
                    </div>

                    {isUnlocked ? (
                      <span className="px-4 py-2 bg-slate-200 text-slate-500 font-bold rounded-btn text-xs">Unlocked ✓</span>
                    ) : (
                      <button
                        onClick={() => handlePurchaseItem(itemId)}
                        disabled={(childProfile?.coins || 0) < item.cost}
                        className={`px-4 py-2 font-black rounded-btn text-sm flex items-center gap-1 min-h-[44px] ${
                          (childProfile?.coins || 0) >= item.cost
                            ? 'bg-brand-primary text-white hover:opacity-90'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Buy: 🪙 {item.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
