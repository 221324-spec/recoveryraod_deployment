import React from "react";
import MyGoals from "./MyGoals";
import MilestoneDashboard from "./MilestoneDashboard";
import Progress from "./Progress";

export default function Goals({ currentView, userId, onBack }) {
  const renderSection = () => {
    switch (currentView) {
      case 'my-goals':
        return <MyGoals userId={userId} onBack={onBack} />;
      case 'milestones':
        return <MilestoneDashboard userId={userId} onBack={onBack} />;
      case 'progress':
        return <Progress onBack={onBack} userId={userId} />;
      default:
        return <MyGoals userId={userId} onBack={onBack} />;
    }
  };

  return <div>{renderSection()}</div>;
}