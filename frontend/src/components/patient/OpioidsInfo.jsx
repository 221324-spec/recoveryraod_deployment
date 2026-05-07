// OpioidsInfo.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

import "./OpioidsInfo.css"; // ✅ reusing same CSS

function OpioidsInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Are opioids addictive?",
      answer:
        "Yes. Opioids are highly addictive. Even when prescribed for pain, prolonged use can lead to dependence and opioid use disorder.¹",
    },
    {
      question: "What are the dangers of opioid misuse?",
      answer:
        "Misuse can cause respiratory depression, overdose, and even death. Long-term use also affects brain chemistry, leading to tolerance and withdrawal.²",
    },
    {
      question: "Can opioid addiction be treated?",
      answer:
        "Yes. Treatment often involves a combination of medications (like methadone or buprenorphine), therapy, and support groups.³",
    },
    {
      question: "What does opioid withdrawal feel like?",
      answer:
        "Withdrawal symptoms may include muscle aches, anxiety, sweating, nausea, vomiting, insomnia, and strong cravings.⁴",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img
            src="/softbg.jpg"
            alt="Opioid Addiction"
            className="hero-img"
          />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Opioid Use & Addiction</h1>
            <p>
              Opioids are powerful pain relieving drugs but also one of the most
              addictive substances. Misuse can lead to dependence, overdose, and
              life threatening consequences.¹
            </p>
          </div>
        </section>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
            <div className="info-text">
              <h2>What Is Opioid Addiction?</h2>
              <p>
                Opioid addiction, clinically known as opioid use disorder (OUD),
                occurs when individuals compulsively use opioids despite harmful
                consequences.²
              </p>
              <p>
                People addicted to opioids may start with prescription painkillers
                but can transition to illicit opioids like heroin or fentanyl.³
              </p>
              <p>
                Over time, the brain adapts to opioids, requiring higher doses to
                feel the same relief  a process called tolerance. This cycle
                increases the risk of overdose and death.⁴
              </p>
              <p>
                Opioid addiction is a medical condition, not a moral weakness.
                Recognizing the signs early and seeking treatment is key to
                recovery.¹
              </p>
            </div>
          </div><br></br><br></br>

          {/* Section - Risks of Mixing */}
          <div className="alcohol-danger-section">
            <h2>Risks of Mixing Opioids with Other Substances</h2>
            <p>
              Mixing opioids with alcohol, benzodiazepines, or sedatives can
              dangerously suppress breathing, increase sedation, and cause fatal
              overdoses.²
            </p>
            <p>
              Many opioid related deaths occur due to polydrug use. Always avoid
              combining opioids with other depressants.³
            </p>
          </div><br></br><br></br>

          {/* Section 2 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Signs and Symptoms of Opioid Addiction</h2>
              <p>
                Opioid addiction can develop quickly, even with prescribed use.
                Warning signs include:¹
              </p>
              <ul>
                <li>Strong cravings and inability to control opioid use</li>
                <li>Taking higher doses than prescribed or for longer periods</li>
                <li>Withdrawal symptoms: nausea, sweating, chills, insomnia</li>
                <li>Neglecting responsibilities due to opioid use</li>
                <li>Continued use despite financial, health, or legal issues</li>
                <li>Doctor shopping or seeking illegal sources of opioids</li>
                <li>Loss of interest in work, school, or family obligations</li>
              </ul>
            </div>
          </div><br></br><br></br>

          {/* Learn More Section */}
          <section className="learn-more-section">
            <h2>Learn More About Opioid Addiction and Recovery</h2>
            <span className="reviewed-badge">✅ Medically Reviewed</span>

            <div className="learn-more-grid">
              <div className="learn-more-card">
                <h3>Opioid Addiction</h3>
                <ul>
                  <li>Risk of Overdose and Respiratory Depression</li>
                  <li>Severe Withdrawal and Relapse Potential</li>
                  <li>Impact on Mental Health (anxiety, depression)</li>
                  <li>Increased Risk of Infectious Diseases (with injection use)</li>
                </ul>
              </div><br></br><br></br>

              <div className="learn-more-card">
                <h3>Treatment and Recovery</h3>
                <ul>
                  <li>Medication-Assisted Treatment (MAT): Methadone, Buprenorphine</li>
                  <li>Counseling and Behavioral Therapy</li>
                  <li>Support Groups (NA, peer recovery programs)</li>
                  <li>Long-Term Relapse Prevention Planning</li>
                </ul>
              </div>
            </div>
          </section><br></br><br></br>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Opioid Misuse</h2>
              <p>Excessive or prolonged opioid use can cause:³</p>
              <div className="danger-points">
                <div className="danger-item">⚠️ Respiratory depression and overdose</div>
                <div className="danger-item">⚠️ Risk of death from fentanyl contamination</div>
                <div className="danger-item">⚠️ Increased tolerance and dependence</div>
                <div className="danger-item">⚠️ Severe withdrawal symptoms</div>
                <div className="danger-item">⚠️ Impaired judgment and risky behaviors</div>
              </div>
            </div>
            <div className="info-image">
              <img src="/causes.jpg" alt="Dangers of Opioid Addiction" />
            </div>
          </div>
        </div><br></br><br></br>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Opioid Addiction</h2>
          <p>
            Professional treatment for opioid addiction saves lives. Combining
            medical care, counseling, and community support can help individuals
            recover and avoid relapse.⁴
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
            <li>National Institute on Drug Abuse (NIDA). Opioid Research Report, 2020.</li>
            <li>Centers for Disease Control and Prevention (CDC). Opioid Overdose Data, 2021.</li>
            <li>Substance Abuse and Mental Health Services Administration (SAMHSA). Medications for OUD, 2022.</li>
            <li>American Psychiatric Association (APA). DSM-5: Opioid Use Disorder.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default OpioidsInfo;
