// CannabisInfo.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaMinus } from "react-icons/fa";

import "./CannabisInfo.css"; // ✅ reuse same CSS

function CannabisInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is cannabis addictive?",
      answer:
        "Yes. While not everyone who uses cannabis becomes addicted, some people develop cannabis use disorder characterized by dependence and withdrawal symptoms.",
    },
    {
      question: "What are cannabis withdrawal symptoms?",
      answer:
        "Common withdrawal symptoms include irritability, sleep disturbances, decreased appetite, anxiety, and strong cravings.",
    },
    {
      question: "Is cannabis safer than alcohol?",
      answer:
        "Cannabis and alcohol affect the body differently. Both carry risks, and combining them can increase impairment and health concerns.",
    },
    {
      question: "Can cannabis use affect mental health?",
      answer:
        "Yes. Heavy or long-term use has been linked to anxiety, depression, and in some cases, psychosis—especially in people with a family history of mental illness.",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img src="/cbg.jpg" alt="Cannabis Info" className="hero-img" />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Cannabis Use & Addiction</h1>
            <p>
              Cannabis is one of the most commonly used psychoactive substances.
              While some use it recreationally or medicinally, frequent use can
              lead to dependence and negative health effects.
            </p>
          </div>
        </section>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
            <div className="info-text">
              <h2>What Is Cannabis Addiction?</h2>
              <p>
                Cannabis addiction, also called cannabis use disorder, is a
                condition where individuals struggle to control cannabis
                consumption despite negative consequences on health, work, and
                relationships.
              </p>
              <p>
                Research shows that around 1 in 10 cannabis users will develop
                a dependency, with the risk increasing for those who start
                using at a young age or use heavily.
              </p>
            </div>
            <div className="info-image">
              <img src="/cocaine.png" alt="Cannabis Leaf" />
            </div>
          </div>

          {/* Section - Cannabis & Alcohol */}
          <div className="alcohol-danger-section">
            <h2>Dangers of Mixing Cannabis with Alcohol</h2>
            <p>
              Combining cannabis with alcohol intensifies impairment, affecting
              judgment, coordination, and reaction time. This significantly
              raises the risk of accidents and risky behavior.
            </p>
            <p>
              Alcohol increases THC absorption in the bloodstream, making the
              effects of cannabis stronger than expected. This can lead to
              extreme dizziness, nausea, anxiety, or even blackouts.
            </p>
            <p>
              Long-term combined use can strain both the brain and liver,
              increasing risks for mental health problems and substance use
              disorders.
            </p>
          </div>

          {/* Section 2 */}
          <div className="info-section reverse">
            <div className="info-text">
              <h2>Signs and Symptoms</h2>
              <ul>
                <li>Strong cravings for cannabis</li>
                <li>Using more than intended</li>
                <li>Withdrawal symptoms like irritability or insomnia</li>
                <li>Decline in motivation, focus, and memory</li>
              </ul>
            </div>
            <div className="info-image">
              <img src="/cbg.jpg" alt="Cannabis Usage" />
            </div>
          </div>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Cannabis Use</h2>
              <p>
                While some people believe cannabis is harmless, heavy or
                prolonged use carries risks:
              </p>
              <div className="danger-points">
                <div className="danger-item">
                  ⚠️ Memory and learning difficulties
                </div>
                <div className="danger-item">
                  ⚠️ Impaired coordination and reaction time
                </div>
                <div className="danger-item">
                  ⚠️ Increased risk of anxiety and depression
                </div>
                <div className="danger-item">
                  ⚠️ Potential link to psychosis in vulnerable individuals
                </div>
                <div className="danger-item">
                  ⚠️ Respiratory issues from smoking
                </div>
                <div className="danger-item">⚠️ Dependency and withdrawal</div>
              </div>
            </div>
            <div className="info-image">
              <img src="/cbg.jpg" alt="Cannabis Risks" />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Cannabis Addiction</h2>
          <p>
            Professional help can make recovery easier. Support groups, therapy,
            and treatment programs are effective for managing cravings and
            reducing harmful use.
          </p>
          <h3>Frequently Asked Questions</h3>
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

export default CannabisInfo;
