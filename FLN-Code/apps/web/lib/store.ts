import { create } from 'zustand';
import { IChildProfile, IUser } from 'shared';

interface AppState {
  parentToken: string | null;
  parentUser: IUser | null;
  selectedChildId: string | null;
  childToken: string | null;
  childProfile: IChildProfile | null;
  soundEnabled: boolean;
  
  setParentSession: (token: string, user: IUser) => void;
  setSelectedChild: (child: IChildProfile | null, token: string | null) => void;
  updateChildProfile: (profile: Partial<IChildProfile>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  logoutParent: () => void;
  logoutChild: () => void;
}

export const useAppStore = create<AppState>((set) => {
  // Safe SSR check
  const getLocalStorage = (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  const getSoundLocalStorage = (): boolean => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('soundEnabled');
      return stored !== 'false';
    }
    return true;
  };

  return {
    parentToken: getLocalStorage('parentToken'),
    parentUser: getLocalStorage('parentUser') ? JSON.parse(getLocalStorage('parentUser')!) : null,
    selectedChildId: getLocalStorage('selectedChildId'),
    childToken: getLocalStorage('childToken'),
    childProfile: getLocalStorage('childProfile') ? JSON.parse(getLocalStorage('childProfile')!) : null,
    soundEnabled: getSoundLocalStorage(),

    setParentSession: (token, user) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('parentToken', token);
        localStorage.setItem('parentUser', JSON.stringify(user));
      }
      set({ parentToken: token, parentUser: user });
    },

    setSelectedChild: (child, token) => {
      if (typeof window !== 'undefined') {
        if (child) {
          localStorage.setItem('selectedChildId', child._id || '');
          localStorage.setItem('childProfile', JSON.stringify(child));
        } else {
          localStorage.removeItem('selectedChildId');
          localStorage.removeItem('childProfile');
        }

        if (token) {
          localStorage.setItem('childToken', token);
        } else {
          localStorage.removeItem('childToken');
        }
      }
      set({ 
        selectedChildId: child ? (child._id || null) : null, 
        childProfile: child,
        childToken: token
      });
    },

    updateChildProfile: (profile) => {
      set((state) => {
        if (!state.childProfile) return {};
        const updated = { ...state.childProfile, ...profile };
        if (typeof window !== 'undefined') {
          localStorage.setItem('childProfile', JSON.stringify(updated));
        }
        return { childProfile: updated };
      });
    },

    setSoundEnabled: (enabled) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
      }
      set({ soundEnabled: enabled });
    },

    logoutParent: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('parentToken');
        localStorage.removeItem('parentUser');
        localStorage.removeItem('selectedChildId');
        localStorage.removeItem('childToken');
        localStorage.removeItem('childProfile');
      }
      set({
        parentToken: null,
        parentUser: null,
        selectedChildId: null,
        childToken: null,
        childProfile: null
      });
    },

    logoutChild: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedChildId');
        localStorage.removeItem('childToken');
        localStorage.removeItem('childProfile');
      }
      set({
        selectedChildId: null,
        childToken: null,
        childProfile: null
      });
    }
  };
});
export default useAppStore;
