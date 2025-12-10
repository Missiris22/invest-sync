import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, Room, Holding } from "../types";
import { authAPI, roomAPI, holdingAPI } from "../services/apiService";

interface AppContextType {
  currentUser: User | null;
  currentRoom: Room | null;
  allHoldings: Holding[]; // User's holdings
  loading: boolean;
  login: (phone: string, name: string) => Promise<boolean>;
  logout: () => void;
  createRoom: () => Promise<string>; // Returns code
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  kickMember: (userId: string) => Promise<void>;
  addHolding: (
    holding: Omit<Holding, "id" | "updatedAt" | "createdAt">
  ) => Promise<void>;
  updateHolding: (id: string, updates: Partial<Holding>) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
  importHoldings: (newHoldings: Partial<Holding>[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to simulate local storage persistence
const loadFromStorage = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // --- Session State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [allHoldings, setAllHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 初始化逻辑：检查本地是否有token，如果有则获取用户信息 ---
  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true);
        const user = await authAPI.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to initialize user:", error);
        // 如果获取用户失败，清除可能无效的token
        authAPI.logout();
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  // --- Actions ---

  const login = async (phone: string, name: string) => {
    try {
      const response = await authAPI.login(phone, name);
      setCurrentUser(response.user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setCurrentRoom(null);
    setAllHoldings([]);
  };

  const createRoom = async () => {
    if (!currentUser) throw new Error("Must be logged in");
    try {
      const newRoom = await roomAPI.create();
      setCurrentRoom(newRoom);
      return newRoom.code;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const joinRoom = async (code: string) => {
    if (!currentUser) return false;
    try {
      const room = await roomAPI.join(code);
      setCurrentRoom(room);
      return true;
    } catch (error) {
      console.error("Failed to join room:", error);
      return false;
    }
  };

  const leaveRoom = async () => {
    if (!currentUser || !currentRoom) return;
    try {
      await roomAPI.leave(currentRoom.code);
      setCurrentRoom(null);
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const kickMember = async (userId: string) => {
    if (!currentRoom || !currentUser) return;
    if (currentRoom.hostId !== currentUser.id) return; // Only host can kick

    try {
      await roomAPI.kickMember(currentRoom.code, userId);
      // 更新本地房间状态
      if (currentRoom) {
        setCurrentRoom((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m !== userId),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to kick member:", error);
    }
  };

  const addHolding = async (
    holding: Omit<Holding, "id" | "updatedAt" | "createdAt">
  ) => {
    try {
      const newHolding = await holdingAPI.addHolding(holding);
      setAllHoldings((prev) => [...prev, newHolding]);
    } catch (error) {
      console.error("Failed to add holding:", error);
      throw error;
    }
  };

  const updateHolding = async (id: string, updates: Partial<Holding>) => {
    try {
      const updatedHolding = await holdingAPI.updateHolding(id, updates);
      setAllHoldings((prev) =>
        prev.map((h) => (h.id === id ? updatedHolding : h))
      );
    } catch (error) {
      console.error("Failed to update holding:", error);
      throw error;
    }
  };

  const removeHolding = async (id: string) => {
    try {
      await holdingAPI.removeHolding(id);
      setAllHoldings((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error("Failed to remove holding:", error);
      throw error;
    }
  };

  const importHoldings = async (newItems: Partial<Holding>[]) => {
    if (!currentUser) return;

    try {
      // 批量添加持仓
      for (const item of newItems) {
        const holdingToAdd: Omit<Holding, "id" | "updatedAt" | "createdAt"> = {
          userId: currentUser.id,
          symbol: item.symbol || "UNKNOWN",
          name: item.name || "Unknown Asset",
          quantity: item.quantity || 0,
          avgPrice: 0,
          currentPrice: item.currentPrice || 0,
          profit: item.profit || 0,
          profitPercent: 0,
          notes: "Auto-imported",
        };
        await holdingAPI.addHolding(holdingToAdd);
      }
      // 重新获取所有持仓
      const updatedHoldings = await holdingAPI.getHoldings();
      setAllHoldings(updatedHoldings);
    } catch (error) {
      console.error("Failed to import holdings:", error);
      throw error;
    }
  };

  // 获取用户持仓
  const fetchHoldings = async () => {
    if (!currentUser) return;
    try {
      const holdings = await holdingAPI.getHoldings();
      setAllHoldings(holdings);
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
    }
  };

  // 当currentUser变化时，获取用户持仓
  useEffect(() => {
    if (currentUser) {
      fetchHoldings();
    } else {
      setAllHoldings([]);
    }
  }, [currentUser]);

  // Sync current room data periodically
  useEffect(() => {
    if (currentRoom) {
      const interval = setInterval(async () => {
        try {
          const freshRoom = await roomAPI.getActive();
          // 只有当获取到有效房间时才更新，避免将currentRoom设置为null
          if (freshRoom) {
            setCurrentRoom(freshRoom);
          }
        } catch (error) {
          console.error("Failed to sync room data:", error);
        }
      }, 5000); // 每5秒同步一次

      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRoom,
        allHoldings,
        loading,
        login,
        logout,
        createRoom,
        joinRoom,
        leaveRoom,
        kickMember,
        addHolding,
        updateHolding,
        removeHolding,
        importHoldings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
