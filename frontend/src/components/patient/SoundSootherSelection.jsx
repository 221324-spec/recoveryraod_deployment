import React from 'react';
import { useNavigate } from 'react-router-dom';

function SoundSootherSelection() {
  const navigate = useNavigate();

  const handleSceneSelect = (scene) => {
    navigate('/soundsoother', { state: { scene } });
  };

  const goToGameDashboard = () => {
    navigate('/'); // ✅ fixed spelling
  };

  const buttonBaseStyle = {
    width: '180px',
    margin: '10px',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.3s',
  };

  const backButtonStyle = {
    ...buttonBaseStyle,
    width: '760px', // Approx width of 4 buttons + margins
    backgroundColor: '#79cdc9ff',
    marginTop: '30px',
  };

  const handleMouseOver = (e) => {
    e.target.style.transform = 'scale(1.02)';
    e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
  };

  const handleMouseOut = (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  };

  return (
    <div
      className="scene-select"
      style={{
        textAlign: 'center',
        padding: '40px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>Sound Soother</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>Choose a calming scene to begin:</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['beach', 'rain', 'forest', 'fire'].map((scene) => (
          <button
            key={scene}
            style={buttonBaseStyle}
            onClick={() => handleSceneSelect(scene)}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          >
            {scene.charAt(0).toUpperCase() + scene.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={goToGameDashboard}
        style={backButtonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default SoundSootherSelection;
