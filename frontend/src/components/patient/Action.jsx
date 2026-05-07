import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaMinus } from "react-icons/fa";

import "./Action.css"; // ✅ Reusing same CSS

function Action({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What does the Action stage mean in recovery?",
      answer:
        "The Action stage is where individuals actively make changes in their lives—such as avoiding triggers, seeking therapy, or adopting healthier routines—to support their recovery. ¹",
    },
    {
      question: "Why is taking action important?",
      answer:
        "Awareness is the first step, but without action, recovery cannot move forward. This stage transforms intention into practical effort and visible change. ²",
    },
    {
      question: "How can I take action effectively?",
      answer:
        "By setting clear goals, seeking professional help, building supportive networks, and practicing consistent healthy habits. ³",
    },
  ];

  return (
    <div className="awareness-layout">
      {/* Header */}
      <header className="topbar">
        <div className="brand-logo">
          <img
            src="/logoo.png"
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
          <img src="/softblue.jpeg" alt="Action Stage" className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>The Action Stage of Recovery</h1>
            <p>
              Action is where commitment meets change. In this stage,
              individuals take practical steps small or big toward breaking free
              from addiction and building a healthier, stronger life. ¹
            </p>
          </div>
        </section><br></br><br></br>

        {/* ✅ Article Intro */}
        <section className="article-header">
          <h1>Action: Turning Awareness into Change</h1>
          <p className="awareness-text">
            The action stage is about moving beyond awareness and making
            intentional choices. It’s where determination transforms into real,
            tangible progress in recovery. ²
          </p>

          <p className="awareness-text">
            Taking action often means building new routines, practicing coping
            strategies, and making lifestyle adjustments. It involves
            persistence, courage, and resilience. ³
          </p>

          <p className="awareness-text">
            Every step you take no matter how small builds momentum. This stage
            proves that recovery is not just possible but within reach through
            consistent action. ¹
          </p>
        </section><br></br><br></br>

       {/* ✅ Video Section */}
<section className="video-section">
  <div className="video-text">
    <h2>The Power of Action</h2>
    <p>
      Action is the bridge between hope and achievement. It reinforces
      commitment and shows that change is not just a thought it’s a
      lived reality. ²
    </p>
  </div>
  <div className="video-container" style={{ position: "relative", display: "inline-block" }}>
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
        pointerEvents: "none"
      }}
    >
      Growth
    </span>
  </div>
</section><br></br><br></br>

        {/* ✅ Detailed Sections */}
        <section className="detailed-sections">
          {/* Steps */}
          <div className="detail-row">
            <img
              src="/bulb.jpeg"
              alt="Steps in Action Stage"
              className="detail-img"
            />
            <div className="detail-text">
              <h2>Steps You Can Take in the Action Stage</h2>
              <p>
                In this stage, recovery becomes more concrete. You actively
                change habits, build healthy coping mechanisms, and strengthen
                your commitment through consistent actions. ¹
              </p>
              <ul>
                <li>Setting <strong>clear recovery goals</strong>. ³</li><br></br>
                <li>
                  Avoiding <strong>triggers and high-risk situations</strong>. ²
                </li><br></br>
                <li>
                  Building <strong>healthy daily routines</strong> (exercise,
                  sleep, nutrition). ³
                </li><br></br>
                <li>
                  Seeking <strong>professional help</strong> and support groups. ¹
                </li><br></br>
                <li>
                  Practicing <strong>stress management</strong> techniques like
                  meditation or journaling. ³
                </li><br></br>
              </ul>
            </div>
          </div><br></br><br></br>

          {/* Benefits */}
          <section className="benefits-section">
            <div className="benefits-row reverse">
              <img
                src="/attention.jpeg"
                alt="Benefits of Action"
                className="benefits-img"
              />
              <div className="benefits-text-unique">
                <h2>Benefits of Taking Action</h2>
                <p>
                  Action solidifies recovery. It brings noticeable changes,
                  boosts self-confidence, and helps create lasting transformation. ²

                </p>
                <ul>
                  <li>
                    <strong>Visible progress:</strong> Action leads to
                    measurable improvements in lifestyle and health. ¹
                  </li><br></br>
                  <li>
                    <strong>Stronger willpower:</strong> Consistency strengthens
                    resilience against relapse. ³
                  </li><br></br>
                  <li>
                    <strong>Positive relationships:</strong> Loved ones see
                    genuine commitment, which rebuilds trust. ²
                  </li><br></br>
                  <li>
                    <strong>Improved self-esteem:</strong> Each step boosts
                    confidence in your ability to change. ¹
                  </li><br></br>
                  <li>
                    <strong>Momentum for growth:</strong> Action keeps recovery
                    moving forward. ³
                  </li><br></br>
                </ul>
              </div>
            </div>
          </section><br></br><br></br>

          {/* Challenges */}
          <section className="challenges-section">
            <div className="challenges-row">
              <img
                src="/challenges.jpg"
                alt="Challenges in Action"
                className="challenges-img"
              />
              <div className="challenges-text-unique">
                <h2>Challenges in the Action Stage</h2>
                <p>
                  While action is powerful, it also comes with obstacles.
                  Recognizing these challenges helps you prepare and overcome
                  them with resilience. ²
                </p>
                <ul>
                  <li>
                    <strong>Fear of relapse:</strong> Staying consistent may
                    feel tough, but each setback is a chance to learn. ¹
                  </li><br></br>
                  <li>
                    <strong>Emotional triggers:</strong> Stress and strong
                    emotions can test your resolve. ³
                  </li><br></br>
                  <li>
                    <strong>Social influences:</strong> Negative circles can
                    pressure you back into old habits. ²
                  </li><br></br>
                  <li>
                    <strong>Self-doubt:</strong> At times, progress may feel
                    slow, but persistence is key. ¹
                  </li><br></br>
                  <li>
                    <strong>Maintaining discipline:</strong> Building new habits
                    takes patience and commitment. ³
                  </li><br></br>
                </ul>
              </div>
            </div>
          </section>
        </section><br></br><br></br>

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

export default Action;

/* -------------------------
   📚 References
   -------------------------
   ¹ Prochaska, J. O., & DiClemente, C. C. (1983). Stages and processes of self-change of smoking: Toward an integrative model of change. *Journal of Consulting and Clinical Psychology, 51*(3), 390–395.
   ² National Institute on Drug Abuse (NIDA). (2020). Principles of Drug Addiction Treatment: A Research-Based Guide (3rd Edition).
   ³ American Psychological Association (APA). (2023). Taking steps toward change: Action stage in recovery. APA Recovery Resources.
*/
