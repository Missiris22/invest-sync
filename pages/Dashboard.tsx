import React from 'react';
import { useApp } from '../context/AppContext';
import HoldingsManager from '../components/HoldingsManager';
import RoomManager from '../components/RoomManager';

const Dashboard: React.FC = () => {
  const { currentRoom } = useApp();
  // Logic: If in room, holdings first then room info. If not, room creation first.
  if (currentRoom) {
    return (
      <div className="space-y-8 animate-fade-in">
        <HoldingsManager />
        <RoomManager />
      </div>
    );
  } else {
    return (
      <div className="space-y-8 animate-fade-in">
        <RoomManager />
        <HoldingsManager />
      </div>
    );
  }
};

export default Dashboard;