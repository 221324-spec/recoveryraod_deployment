import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaMinus } from "react-icons/fa";

import "./Progress.css"; // ✅ Reusing same CSS

function Progress({ onBack, userId }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What does the Progress stage mean in recovery?",
      answer:
        "The Progress stage is about maintaining the positive changes achieved during action. It focuses on reinforcing healthy habits and monitoring growth over time. ¹",
    },
    {
      question: "Why is progress important in recovery?",
      answer:
        "Progress ensures that recovery is sustainable. It prevents relapse by building consistency, stability, and long-term resilience. ²",
    },
    {
      question: "How can I measure progress effectively?",
      answer:
        "By tracking milestones, celebrating small wins, reflecting on personal growth, and maintaining ongoing support systems. ³",
    },
  ];

  return (
    <div className="awareness-layout">
      {/* Header */}
      <header className="topbar">
        <div className="brand-logo">
          <img
            src="/logo.png"
            alt="Recovery Road Logo"
            className="brand-image"
            loading="lazy"
          />
        </div>
        <nav className="header-links">
          <ul>
            <li onClick={onBack || (() => navigate("/"))}>
              <FaHome /> Home
            </li>
            <li onClick={onBack || (() => navigate("/drugtypes"))}>🧪 Drug Types</li>
          </ul>
        </nav>
      </header>

      <main className="main-container">
        {/* ✅ Hero */}
        <section className="hero">
          <img src="/pastel.jpeg" alt="Progress Stage" className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>The Progress Stage of Recovery</h1>
            <p>
              Progress is where growth is maintained. It’s about tracking your
              journey, reinforcing healthy changes, and preventing setbacks. ¹
            </p>
          </div>
        </section><br></br><br></br>

        {/* ✅ Article Intro */}
        <section className="article-header">
          <h1>Progress: Sustaining Growth in Recovery</h1>
          <p className="awareness-text">
            The progress stage is about building stability. It’s where recovery
            is strengthened through consistent effort and self-reflection. ²
          </p>

          <p className="awareness-text">
            Progress is not just about avoiding relapseit’s about thriving,
            learning from challenges, and celebrating achievements. ³
          </p>

          <p className="awareness-text">
            Every milestone in progress builds resilience and confidence,
            showing that recovery is sustainable and lifelong. ¹
          </p>
        </section><br></br><br></br>

        {/* ✅ Video Section */}
        <section className="video-section">
          <div className="video-text">
            <h2>The Power of Progress</h2>
            <p>
              Progress reminds us that recovery is not a one-time event but a
              continuous journey of growth, resilience, and stability. ²
            </p>
          </div>
          <div
            className="video-container"
            style={{ position: "relative", display: "inline-block" }}
          >
            <video controls>
              <source src="/growth.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Overlay word */}
            <span
              style={{
                position: "absolute",
                top: "20%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "yellow",
                fontSize: "2rem",
                fontWeight: "bold",
                textShadow: "2px 2px 6px rgba(7, 7, 5, 0.7)",
                pointerEvents: "none",
              }}
            >
              Stability
            </span>
          </div>
        </section><br></br><br></br>

        {/* ✅ Detailed Sections */}
        <section className="detailed-sections">
          {/* Steps */}
          <div className="detail-row">
            <img
              src="/bulb.jpeg"
              alt="Steps in Progress Stage"
              className="detail-img"
            />
            <div className="detail-text">
              <h2>Steps You Can Take in the Progress Stage</h2>
              <p>
                In this stage, the focus is on maintaining healthy routines,
                preventing relapse, and measuring growth with patience. ¹
              </p>
              <ul>
                <li>Tracking <strong>daily/weekly recovery milestones</strong>. ³</li><br></br>
                <li>Strengthening <strong>positive routines</strong>. ²</li><br></br>
                <li>
                  Practicing <strong>reflection and gratitude</strong> journaling. ³
                </li><br></br>
                <li>
                  Maintaining <strong>professional or peer support</strong>. ¹
                </li><br></br>
                <li>
                  Adjusting <strong>goals as you grow stronger</strong>. ³
                </li><br></br>
              </ul>
            </div>
          </div>

          {/* Benefits */}
          <section className="benefits-section">
            <div className="benefits-row reverse">
              <img
                src="/progress.jpg"
                alt="Benefits of Progress"
                className="benefits-img"
              />
              <div className="benefits-text-unique">
                <h2>Benefits of Tracking Progress</h2>
                <p>
                  Progress ensures long-term recovery. It provides confidence,
                  stability, and measurable growth. ²
                </p>
                <ul>
                  <li>
                    <strong>Visible growth:</strong> Recognizing milestones
                    builds self-esteem. ¹
                  </li><br></br>
                  <li>
                    <strong>Consistency:</strong> Sustained habits reduce the
                    chance of relapse. ³
                  </li><br></br>
                  <li>
                    <strong>Increased resilience:</strong> Overcoming challenges
                    strengthens mental health. ²
                  </li><br></br>
                  <li>
                    <strong>Empowerment:</strong> Tracking growth fosters hope
                    and motivation. ¹
                  </li><br></br>
                  <li>
                    <strong>Lifelong stability:</strong> Progress maintains
                    recovery as a daily practice. ³
                  </li><br></br>
                </ul>
              </div>
            </div>
          </section>

          {/* Challenges */}
          <section className="challenges-section">
            <div className="challenges-row">
              <img
                src="/challenges.jpg"
                alt="Challenges in Progress"
                className="challenges-img"
              />
              <div className="challenges-text-unique">
                <h2>Challenges in the Progress Stage</h2>
                <p>
                  Sustaining progress can feel difficult. Recognizing challenges
                  helps build resilience and consistency. ²
                </p>
                <ul>
                  <li>
                    <strong>Complacency:</strong> Feeling “cured” may lead to
                    relapse. ¹
                  </li><br></br>
                  <li>
                    <strong>Life stressors:</strong> External pressures can
                    challenge stability. ³
                  </li><br></br>
                  <li>
                    <strong>Slow progress:</strong> Growth can feel gradual, but
                    patience is key. ²
                  </li><br></br>
                  <li>
                    <strong>Loss of motivation:</strong> Without reminders,
                    habits can fade. ¹
                  </li><br></br>
                  <li>
                    <strong>Isolation:</strong> Avoiding support systems can
                    weaken recovery. ³
                  </li><br></br>
                </ul>
              </div>
            </div>
          </section>
        </section>

        {/* ✅ FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${activeIndex === index ? "active" : ""}`}
              >
                <div
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {activeIndex === index ? <FaMinus /> : <FaPlus />}
                  </span>
                </div>
                {activeIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Progress;

/* -------------------------
   📚 References
   -------------------------
   ¹ Prochaska, J. O., & DiClemente, C. C. (1983). Stages and processes of self-change of smoking: Toward an integrative model of change. *Journal of Consulting and Clinical Psychology, 51*(3), 390–395.
   ² National Institute on Drug Abuse (NIDA). (2020). Principles of Drug Addiction Treatment: A Research-Based Guide (3rd Edition).
   ³ American Psychological Association (APA). (2023). Sustaining recovery: The progress stage and long-term change. APA Recovery Resources.
*/
