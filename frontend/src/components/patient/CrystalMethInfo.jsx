// CrystalMethInfo.js 
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

import "./CrystalMethInfo.css"; // ✅ reusing same CSS

function CrystalMethInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is crystal meth addictive?",
      answer:
        "Yes. Crystal meth is one of the most addictive stimulants. It floods the brain with dopamine, leading to intense euphoria but rapid dependence.¹",
    },
    {
      question: "What are the dangers of crystal meth use?",
      answer:
        "Meth use can cause severe dental problems ('meth mouth'), skin sores, paranoia, aggression, heart failure, and brain damage.²",
    },
    {
      question: "Can meth addiction be treated?",
      answer:
        "Yes, but it is challenging. Treatments focus on behavioral therapies, counseling, and support programs. Currently, no FDA-approved medication exists for meth addiction.³",
    },
    {
      question: "What does meth withdrawal feel like?",
      answer:
        "Withdrawal often includes fatigue, depression, intense drug cravings, anxiety, and disturbed sleep.⁴",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img
            src="/softbg.jpg"
            alt="Crystal Meth Addiction"
            className="hero-img"
          />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Crystal Meth Use & Addiction</h1>
            <p>
              Crystal methamphetamine is a powerful stimulant that affects the
              central nervous system. It creates intense highs but also severe
              health risks, rapid addiction, and long-term brain changes.¹
            </p>
          </div>
        </section><br></br>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
            <div className="info-text">
              <h2>What Is Crystal Meth Addiction?</h2>
              <p>
                Crystal meth, a form of methamphetamine, produces an intense rush
                of energy and euphoria by dramatically increasing dopamine in the
                brain.²
              </p>
              <p>
                Repeated use alters brain chemistry, impairing memory,
                decision making, and impulse control. These effects can last long
                after drug use has stopped.³
              </p>
              <p>
                Meth is often smoked, snorted, injected, or swallowed. Each method
                rapidly increases addiction risk.⁴
              </p>
              <p>
                Over time, meth addiction can destroy mental health, physical
                health, and social relationships, making recovery urgent.¹
              </p>
            </div>
          </div>

          {/* Section - Risks of Mixing */}
          <div className="alcohol-danger-section">
            <h2>Risks of Mixing Meth with Other Substances</h2>
            <p>
              Mixing meth with alcohol, opioids, or benzodiazepines increases the
              risk of heart failure, psychosis, overdose, and unpredictable
              behavior.²
            </p>
            <p>
              Combining stimulants and depressants can mask overdose symptoms,
              leading to fatal consequences.³
            </p>
          </div><br></br><br></br>

          {/* Section 2 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Signs and Symptoms of Meth Addiction</h2>
              <p>
                Meth addiction develops rapidly and comes with alarming signs.¹
              </p>
              <ul>
                <li>Extreme energy followed by severe crashes</li>
                <li>Rapid weight loss and malnutrition</li>
                <li>Severe dental issues (“meth mouth”)</li>
                <li>Paranoia, hallucinations, or violent behavior</li>
                <li>Skin sores from excessive scratching</li>
                <li>Memory loss, confusion, or poor judgment</li>
                <li>Neglect of responsibilities and relationships</li>
              </ul>
            </div>
          </div> <br></br><br></br>

          {/* Learn More Section */}
          <section className="learn-more-section">
            <h2>Learn More About Meth Addiction and Recovery</h2>
            <span className="reviewed-badge">✅ Medically Reviewed</span>

            <div className="learn-more-grid">
              <div className="learn-more-card">
                <h3>Meth Addiction</h3>
                <ul>
                  <li>Impact on Brain Chemistry and Function</li>
                  <li>Severe Mental Health Risks (psychosis, paranoia)</li>
                  <li>High Risk of Relapse</li>
                  <li>Long-Term Cognitive Impairment</li>
                </ul>
              </div>

              <div className="learn-more-card">
                <h3>Treatment and Recovery</h3>
                <ul>
                  <li>Behavioral Therapy and Counseling</li>
                  <li>Contingency Management Programs</li>
                  <li>Support Groups and Peer Recovery</li>
                  <li>Long-Term Relapse Prevention Strategies</li>
                </ul>
              </div>
            </div>
          </section><br></br><br></br><br></br><br></br>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Meth Use</h2>
              <p>Chronic methamphetamine use can lead to:³</p>
              <div className="danger-points">
                <div className="danger-item">⚠️ Severe brain damage and memory loss</div>
                <div className="danger-item">⚠️ Heart attack or stroke</div>
                <div className="danger-item">⚠️ Permanent dental decay</div>
                <div className="danger-item">⚠️ Extreme paranoia and hallucinations</div>
                <div className="danger-item">⚠️ Risk of sudden death from overdose</div>
              </div>
            </div>
            <div className="info-image">
              <img src="/dd.jpeg" alt="Dangers of Crystal Meth" />
            </div>
          </div>
        </div><br></br><br></br>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Crystal Meth Addiction</h2>
          <p>
            Crystal meth addiction is serious but recovery is possible. With
            therapy, structured support, and strong relapse prevention strategies,
            individuals can rebuild their lives.⁴
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

        {/* References Section (Hidden for professionalism) */}
        <section className="references hidden-section">
          <h2>References</h2>
          <ol>
            <li>National Institute on Drug Abuse (NIDA). Methamphetamine Research Report, 2021.</li>
            <li>Centers for Disease Control and Prevention (CDC). Methamphetamine Data, 2021.</li>
            <li>Substance Abuse and Mental Health Services Administration (SAMHSA). Treatment Approaches for Stimulant Use Disorders, 2022.</li>
            <li>American Psychiatric Association (APA). DSM-5: Stimulant Use Disorder.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default CrystalMethInfo;
