import { User, Room, Holding } from '../types';

// API基础URL
const API_BASE_URL = '/api';

// 从localStorage获取JWT token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// 设置JWT token到localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// 清除JWT token
const clearAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// 通用API请求函数
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`
    }));
    throw new Error(errorData.message || 'API request failed');
  }
  
  return response.json();
};

// 认证相关API
export const authAPI = {
  // 登录
  login: async (phone: string, name: string) => {
    const response = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, name }),
    });
    setAuthToken(response.token);
    return response;
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    return apiRequest<User>('/auth/me');
  },
  
  // 登出（客户端操作）
  logout: () => {
    clearAuthToken();
  },
};

// 房间相关API
export const roomAPI = {
  // 创建房间
  create: async () => {
    return apiRequest<Room>('/rooms', {
      method: 'POST',
    });
  },
  
  // 加入房间
  join: async (code: string) => {
    return apiRequest<Room>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  
  // 离开房间
  leave: async (code: string) => {
    return apiRequest<void>('/rooms/leave', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  
  // 获取当前用户的活跃房间
  getActive: async () => {
    return apiRequest<Room | null>('/rooms/active');
  },
  
  // 踢出成员
  kickMember: async (code: string, userIdToKick: string) => {
    return apiRequest<void>('/rooms/kick', {
      method: 'POST',
      body: JSON.stringify({ code, userIdToKick }),
    });
  },
};

// 持仓相关API
export const holdingAPI = {
  // 获取当前用户的持仓
  getHoldings: async () => {
    return apiRequest<Holding[]>('/holdings');
  },
  
  // 添加持仓
  addHolding: async (holding: Omit<Holding, 'id' | 'updatedAt' | 'createdAt'>) => {
    return apiRequest<Holding>('/holdings', {
      method: 'POST',
      body: JSON.stringify(holding),
    });
  },
  
  // 更新持仓
  updateHolding: async (id: string, updates: Partial<Holding>) => {
    return apiRequest<Holding>(`/holdings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  // 删除持仓
  removeHolding: async (id: string) => {
    return apiRequest<void>(`/holdings/${id}`, {
      method: 'DELETE',
    });
  },
};
