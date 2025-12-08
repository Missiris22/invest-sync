import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Room, Holding } from '../types';

interface AppContextType {
  currentUser: User | null;
  currentRoom: Room | null;
  allUsers: User[]; // Simulated DB table
  allHoldings: Holding[]; // Simulated DB table
  login: (phone: string, name: string) => void;
  logout: () => void;
  createRoom: () => string; // Returns code
  joinRoom: (code: string) => boolean;
  leaveRoom: () => void;
  kickMember: (userId: string) => void;
  addHolding: (holding: Holding) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  importHoldings: (newHoldings: Partial<Holding>[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to simulate local storage persistence
const loadFromStorage = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State (Simulating DB Tables) ---
  const [allUsers, setAllUsers] = useState<User[]>(() => loadFromStorage('db_users', []));
  const [rooms, setRooms] = useState<Room[]>(() => loadFromStorage('db_rooms', []));
  const [allHoldings, setAllHoldings] = useState<Holding[]>(() => loadFromStorage('db_holdings', []));
  
  // --- Session State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadFromStorage('session_user', null));
  const [currentRoom, setCurrentRoom] = useState<Room | null>(() => loadFromStorage('session_room', null));

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('db_users', JSON.stringify(allUsers)), [allUsers]);
  useEffect(() => localStorage.setItem('db_rooms', JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem('db_holdings', JSON.stringify(allHoldings)), [allHoldings]);
  useEffect(() => localStorage.setItem('session_user', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('session_room', JSON.stringify(currentRoom)), [currentRoom]);

  // --- Actions ---

  const login = (phone: string, name: string) => {
    let user = allUsers.find(u => u.phone === phone);
    if (!user) {
      user = { id: crypto.randomUUID(), phone, name, joinedAt: Date.now() };
      setAllUsers(prev => [...prev, user!]);
    }
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRoom(null);
  };

  const createRoom = () => {
    if (!currentUser) throw new Error("Must be logged in");
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit code
    const newRoom: Room = {
      code,
      hostId: currentUser.id,
      members: [currentUser.id],
      createdAt: Date.now()
    };
    setRooms(prev => [...prev, newRoom]);
    setCurrentRoom(newRoom);
    return code;
  };

  const joinRoom = (code: string) => {
    if (!currentUser) return false;
    const roomIndex = rooms.findIndex(r => r.code === code);
    if (roomIndex === -1) return false;

    const room = rooms[roomIndex];
    if (!room.members.includes(currentUser.id)) {
      const updatedRoom = { ...room, members: [...room.members, currentUser.id] };
      const newRooms = [...rooms];
      newRooms[roomIndex] = updatedRoom;
      setRooms(newRooms);
      setCurrentRoom(updatedRoom);
    } else {
      setCurrentRoom(room);
    }
    return true;
  };

  const leaveRoom = () => {
    if (!currentUser || !currentRoom) return;
    const roomIndex = rooms.findIndex(r => r.code === currentRoom.code);
    if (roomIndex !== -1) {
      const updatedMembers = currentRoom.members.filter(m => m !== currentUser.id);
      const updatedRoom = { ...currentRoom, members: updatedMembers };
      
      const newRooms = [...rooms];
      // If room empty, maybe delete? Keeping simpler for now.
      newRooms[roomIndex] = updatedRoom;
      setRooms(newRooms);
    }
    setCurrentRoom(null);
  };

  const kickMember = (userId: string) => {
    if (!currentRoom || !currentUser) return;
    if (currentRoom.hostId !== currentUser.id) return; // Only host can kick

    const roomIndex = rooms.findIndex(r => r.code === currentRoom.code);
    if (roomIndex !== -1) {
      const updatedMembers = currentRoom.members.filter(m => m !== userId);
      const updatedRoom = { ...currentRoom, members: updatedMembers };
      
      const newRooms = [...rooms];
      newRooms[roomIndex] = updatedRoom;
      setRooms(newRooms);
      setCurrentRoom(updatedRoom);
    }
  };

  const addHolding = (holding: Holding) => {
    setAllHoldings(prev => [...prev, holding]);
  };

  const updateHolding = (id: string, updates: Partial<Holding>) => {
    setAllHoldings(prev => prev.map(h => h.id === id ? { ...h, ...updates, updatedAt: Date.now() } : h));
  };

  const removeHolding = (id: string) => {
    setAllHoldings(prev => prev.filter(h => h.id !== id));
  };

  const importHoldings = (newItems: Partial<Holding>[]) => {
    if (!currentUser) return;
    const itemsToAdd: Holding[] = newItems.map(item => ({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      symbol: item.symbol || 'UNKNOWN',
      name: item.name || 'Unknown Asset',
      quantity: item.quantity || 0,
      avgPrice: 0,
      currentPrice: item.currentPrice || 0,
      profit: item.profit || 0,
      profitPercent: 0,
      notes: "Auto-imported",
      updatedAt: Date.now()
    }));
    setAllHoldings(prev => [...prev, ...itemsToAdd]);
  };

  // Sync current room data periodically or when dependencies change
  useEffect(() => {
    if (currentRoom) {
      const freshRoom = rooms.find(r => r.code === currentRoom.code);
      if (freshRoom && JSON.stringify(freshRoom) !== JSON.stringify(currentRoom)) {
        setCurrentRoom(freshRoom);
      }
    }
  }, [rooms, currentRoom?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{
      currentUser, currentRoom, allUsers, allHoldings,
      login, logout, createRoom, joinRoom, leaveRoom, kickMember,
      addHolding, updateHolding, removeHolding, importHoldings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};