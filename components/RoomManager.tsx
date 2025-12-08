import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, LogOut, UserX, Copy } from 'lucide-react';

const RoomManager: React.FC = () => {
  const { 
    currentUser, currentRoom, createRoom, joinRoom, leaveRoom, 
    allUsers, kickMember 
  } = useApp();
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length !== 4) {
      setError("房间号必须是4位数字");
      return;
    }
    const success = joinRoom(inputCode);
    if (!success) setError("未找到房间或加入失败");
    else setError('');
  };

  const handleCreate = () => {
    createRoom();
  };

  if (currentRoom) {
    const isHost = currentRoom.hostId === currentUser?.id;
    const memberDetails = currentRoom.members.map(mid => allUsers.find(u => u.id === mid)).filter(Boolean);

    // Simplified Active Room View
    return (
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Room Info */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-700 p-2 rounded-lg">
              <Users className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs uppercase font-bold">房间号</span>
                <span className="font-mono text-xl text-white font-bold tracking-widest">{currentRoom.code}</span>
              </div>
              <p className="text-slate-500 text-xs">
                {memberDetails.length} 位成员在线
              </p>
            </div>
          </div>

          {/* Member List (Compact) */}
          <div className="flex-1 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <div className="flex items-center gap-2">
                {memberDetails.map((member) => (
                  <div key={member?.id} className="relative group shrink-0">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${currentRoom.hostId === member?.id ? 'border-yellow-500/50 bg-slate-700' : 'border-slate-600 bg-slate-800'} text-slate-300`}
                      title={`${member?.name} (${member?.phone})`}
                    >
                      {member?.name.substring(0, 1).toUpperCase()}
                    </div>
                    {/* Hover Tooltip/Kick Action */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10 border border-slate-700">
                      {member?.name} {currentRoom.hostId === member?.id ? '(房主)' : ''}
                    </div>
                     {isHost && member?.id !== currentUser?.id && (
                        <button 
                          onClick={() => kickMember(member!.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                          title="移除成员"
                        >
                          <UserX size={8} />
                        </button>
                      )}
                  </div>
                ))}
             </div>
          </div>

          {/* Actions */}
          <button 
            onClick={leaveRoom}
            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs flex items-center gap-1.5 font-medium transition whitespace-nowrap ml-auto md:ml-0"
          >
            <LogOut size={14} /> 退出房间
          </button>
        </div>
      </div>
    );
  }

  // Not in a room: Show large prominent actions
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Join Room */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-4">加入队伍</h3>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="输入4位房间号"
            className="bg-slate-900 border border-slate-600 text-white text-center text-3xl tracking-[0.5em] rounded-lg py-4 focus:ring-2 focus:ring-blue-500 outline-none font-mono placeholder:tracking-normal placeholder:text-lg placeholder:text-slate-600"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition active:scale-95 shadow-lg shadow-blue-900/20">
            进入房间
          </button>
        </form>
      </div>

      {/* Create Room */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center shadow-sm">
        <div className="bg-slate-700/50 p-4 rounded-full mb-4 ring-1 ring-slate-600">
          <Plus className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">创建新房间</h3>
        <p className="text-slate-400 mb-6 text-sm max-w-xs">创建一个私密空间，邀请朋友共享投资信息。</p>
        <button 
          onClick={handleCreate}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-lg transition active:scale-95 border border-slate-600"
        >
          创建房间
        </button>
      </div>
    </div>
  );
};

export default RoomManager;