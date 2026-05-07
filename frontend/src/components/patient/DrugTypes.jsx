// DrugTypes.js
import React from "react";
import { useNavigate } from "react-router-dom";
import {  } from "react-icons/fa";

import "./DrugTypes.css";

function DrugTypes({ onBack, onSelectSubtopic }) {
  const navigate = useNavigate();

  const drugTypes = [
    { id: 1, name: "Alcohol", key: "alcoholinfo" },
    { id: 2, name: "Crystal Meth", key: "crystalmethinfo" },
    { id: 3, name: "Cocaine", key: "cocaineinfo" },
    { id: 4, name: "Opioids", key: "opioidsinfo" },
    { id: 5, name: "Marijuana", key: "marijuanainfo" },
  ];

  const recoveryStages = [
    { id: 1, name: "Awareness", key: "awareness" },
    { id: 2, name: "Action", key: "action" },
    { id: 3, name: "Progress", key: "progress" },
  ];

  const handleDrugClick = (key) => {
    if (onSelectSubtopic) {
      onSelectSubtopic(key);
    } else {
      navigate(`/${key}`);
    }
  };

  const handleStageClick = (key) => {
    if (onSelectSubtopic) {
      onSelectSubtopic(key);
    } else {
      navigate(`/${key}`);
    }
  };

  return (
    <div className="drug-types-layout">
      <main className="main-content flex flex-col min-h-screen">
        {/* Page Heading */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="dashboard-heading text-center mb-10">
            <h1 className="page-title">Types of Drugs</h1>
            <p className="page-subtitle">
              Explore different categories of drugs, their risks, and recovery resources. 
              Click a drug type to learn more.
            </p>
          </div>

          {/* Grid of Cards - Drug Types */}
          <div className="dashboard-cards">
            {drugTypes.map((drug) => (
              <div
                key={drug.id}
                className="drug-card cursor-pointer"
                onClick={() => handleDrugClick(drug.key)}
              >
                <h2 className="drug-name">{drug.name}</h2>
              </div>
            ))}
          </div>

          {/* ✅ Recovery Stages Section */}
          <div className="dashboard-heading text-center mt-16 mb-10">
            <h1 className="page-title">Stages of Recovery</h1>
            <p className="page-subtitle">
              Recovery is a journey of growth. Here are the 3 key stages:
            </p>
          </div>

          <div className="dashboard-cards">
            {recoveryStages.map((stage) => (
              <div
                key={stage.id}
                className="drug-card cursor-pointer"
                onClick={() => handleStageClick(stage.key)}
              >
                <h2 className="drug-name">{stage.name}</h2>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DrugTypes;
