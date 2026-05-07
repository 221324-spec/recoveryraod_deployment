// LearningLibrary.js
import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

import "./LearningLibrary.css"; // ✅ External CSS file

// Import topic components
import DrugTypes from "./DrugTypes";
import DrugAddiction from "./DrugAddiction";
import MentalHealth from "./MentalHealth";
import CausesOfDrugAddiction from "./CausesOfDrugAddiction";
import AlcoholInfo from "./AlcoholInfo";
import CannabisInfo from "./CannabisInfo";
import CocaineInfo from "./CocaineInfo";
import CrystalMethInfo from "./CrystalMethInfo";
import MarijuanaInfo from "./MarijuanaInfo";
import OpioidsInfo from "./OpioidsInfo";
import Awareness from "./Awareness";
import Action from "./Action";
import Progress from "./Progress";

export default function LearningLibrary({ onViewChange, currentView }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const backToDashboard = () => setSelectedTopic(null);

  const renderTopic = () => {
    const backToLibrary = () => setSelectedTopic(null);

    switch (selectedTopic) {
      case 'drugtypes':
        return <DrugTypes onBack={backToLibrary} onSelectSubtopic={setSelectedTopic} />;
      case 'drugaddiction':
        return <DrugAddiction onBack={backToLibrary} />;
      case 'mentalhealth':
        return <MentalHealth onBack={backToLibrary} />;
      case 'causesofdrugaddiction':
        return <CausesOfDrugAddiction onBack={backToLibrary} />;
      case 'alcoholinfo':
        return <AlcoholInfo onBack={backToLibrary} />;
      case 'cannabisinfo':
        return <CannabisInfo onBack={backToLibrary} />;
      case 'cocaineinfo':
        return <CocaineInfo onBack={backToLibrary} />;
      case 'crystalmethinfo':
        return <CrystalMethInfo onBack={backToLibrary} />;
      case 'marijuanainfo':
        return <MarijuanaInfo onBack={backToLibrary} />;
      case 'opioidsinfo':
        return <OpioidsInfo onBack={backToLibrary} />;
      case 'awareness':
        return <Awareness onBack={backToLibrary} />;
      case 'action':
        return <Action onBack={backToLibrary} />;
      case 'progress':
        return <Progress onBack={backToLibrary} />;
      default:
        return null;
    }
  };

  if (selectedTopic) {
    return (
      <div className="learning-content-wrapper">
        <button
          onClick={backToDashboard}
          className="learning-back-btn"
        >
          <FaArrowLeft /> Back to Learning Library
        </button>
        <div className="learning-topic-content">
          {renderTopic()}
        </div>
      </div>
    );
  }

  return (
    <div className="learning-library-container">
      {/* ✅ Centered Heading */}
      <div className="learning-header">
        <h1>Learning & Awareness Library</h1>
        <p>
          Explore key resources on drug types, addiction, and mental health.
          Click a card below to learn more.
        </p>
      </div>

      {/* ✅ Grid with responsive cards */}
      <section className="learning-grid">
        {/* Drug Types Card */}
        <article
          className="ll-round-card"
          onClick={() => setSelectedTopic('drugtypes')}
        >
          <img src="/dd.jpeg" alt="Drug Types" />
          <div className="ll-round-body">
            <h3>Drug Types</h3>
            <p>
              Learn about different categories of drugs, their effects, and associated risks.
            </p>
          </div>
        </article>

        {/* Drug Addiction Card */}
        <article
          className="ll-round-card"
          onClick={() => setSelectedTopic('drugaddiction')}
        >
          <img src="/therapy.jpg" alt="Drug Addiction" />
          <div className="ll-round-body">
            <h3>Drug Addiction</h3>
            <p>
              Understand addiction, recovery challenges, and strategies for long-term wellness.
            </p>
          </div>
        </article>

        {/* Mental Health Card */}
        <article
          className="ll-round-card"
          onClick={() => setSelectedTopic('mentalhealth')}
        >
          <img src="/addiction.jpg" alt="Mental Health" />
          <div className="ll-round-body">
            <h3>Drug Addiction & Mental Health</h3>
            <p>
              Explore the connection between mental well-being and recovery, including coping strategies.
            </p>
          </div>
        </article>

        {/* ✅ Causes of Drug Addiction Card */}
        <article
          className="ll-round-card"
          onClick={() => setSelectedTopic('causesofdrugaddiction')}
        >
          <img src="/causes.jpg" alt="Causes of Drug Addiction" />
          <div className="ll-round-body">
            <h3>Causes of Drug Addiction</h3>
            <p>
              Discover the underlying social, psychological, and biological factors that contribute to drug addiction.
            </p>
          </div>
        </article>

        {/* ✅ Awareness Card */}
        <article
          className="ll-round-card"
          onClick={() => setSelectedTopic('awareness')}
        >
          <img src="/softbg.jpg" alt="Awareness" />
          <div className="ll-round-body">
            <h3>Awareness: The First Step</h3>
            <p>
              Learn about the awareness stage of recovery, recognizing the need for change, and building self-reflection.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
