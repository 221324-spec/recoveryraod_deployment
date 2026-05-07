// MarijuanaInfo.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaPlus, FaMinus } from "react-icons/fa";

import "./MarijuanaInfo.css"; 

function MarijuanaInfo({ onBack }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is marijuana addictive?",
      answer:
        "Yes. While not everyone who uses marijuana becomes addicted, some individuals develop cannabis use disorder, which can affect brain function, motivation, and daily life.¹",
    },
    {
      question: "Can marijuana affect mental health?",
      answer:
        "Regular marijuana use, especially in young people, has been linked to anxiety, depression, and in some cases psychosis.²",
    },
    {
      question: "Is marijuana safer than alcohol or tobacco?",
      answer:
        "Although often perceived as safer, marijuana still carries risks including impaired memory, lung problems (when smoked), and dependence.³",
    },
    {
      question: "Can marijuana withdrawal happen?",
      answer:
        "Yes. Symptoms may include irritability, trouble sleeping, cravings, and decreased appetite when regular users stop.⁴",
    },
  ];

  return (
    <div className="alcohol-info-layout">
      <main className="main-container">
        {/* Hero Section */}
        <section className="hero">
          <img
            src="/marijuana.jpg"
            alt="Marijuana Addiction"
            className="hero-img"
          />
          <div className="hero-overlay"></div>
          <div className="hero-text-overlay">
            <h1>Understanding Marijuana Use & Addiction</h1>
            <p>
              Marijuana is one of the most commonly used substances worldwide. While
              some use it recreationally or medicinally, excessive use can lead to
              cannabis use disorder and long-term health impacts.¹
            </p>
          </div>
        </section>

        <div className="content">
          {/* Section 1 */}
          <div className="info-section">
            <div className="info-text">
              <h2>What Is Marijuana Addiction?</h2>
              <p>
                Marijuana addiction, medically known as cannabis use disorder, occurs when 
                a person becomes dependent on marijuana and struggles to control or stop 
                its use despite facing negative consequences.¹
              </p>
              <p>
                While many people believe marijuana is not addictive, research shows that 
                long-term and heavy use can lead to both psychological and physical 
                dependence. Over time, individuals may develop tolerance and withdrawal 
                symptoms such as irritability, anxiety, sleep problems, and cravings.²
              </p>
              <p>
                Marijuana addiction can also affect brain development, especially in young 
                people, and may increase the risk of mental health concerns such as 
                depression, memory problems, and reduced motivation.³
              </p>
              <p>
                This section explores marijuana use, its risks, warning signs, and recovery 
                options to provide awareness and encourage individuals to take positive 
                steps toward a healthier life.⁴
              </p>
            </div>
          </div><br></br><br></br>

          {/* Section - Effects of Mixing Marijuana with Other Substances */}
          <div className="alcohol-danger-section">
            <h2>Risks of Mixing Marijuana with Other Substances</h2>
            <p>
              Many people mix marijuana with alcohol or other drugs. Doing so can
              amplify impairment, increase the risk of accidents, and lead to
              unpredictable mental or physical health effects.²
            </p>
            <p>
              Mixing marijuana with alcohol can greatly increase dizziness, nausea, and 
              impaired judgment. Combining with opioids or sedatives may increase the 
              risk of overdose.³
            </p>
          </div><br></br><br></br>

          {/* Section 2 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Signs and Symptoms of Marijuana Addiction</h2>
              <p>
                Marijuana addiction, also called cannabis use disorder, can gradually
                develop when regular use becomes compulsive and difficult to control. 
                Recognizing the signs early can help individuals seek timely support.¹
              </p>
              <ul>
                <li>Strong cravings and persistent thoughts about using marijuana¹</li>
                <li>Difficulty reducing or stopping use despite repeated attempts²</li>
                <li>Withdrawal symptoms such as irritability, insomnia, and appetite loss³</li>
                <li>Increasing tolerance requiring more marijuana to feel effects²</li>
                <li>Neglecting responsibilities at school, work, or home¹</li>
                <li>Loss of interest in hobbies or social activities³</li>
                <li>Continued use despite health, relationship, or financial issues²</li>
                <li>Spending excessive time obtaining, using, or recovering from marijuana³</li>
              </ul>
            </div>
          </div><br></br><br></br>

          {/* Learn More Section */}
          <section className="learn-more-section">
            <h2>Learn More About Marijuana Addiction and Recovery</h2>
            <span className="reviewed-badge">✅ Medically Reviewed</span>

            <div className="learn-more-grid">
              <div className="learn-more-card">
                <h3>Marijuana Addiction</h3>
                <ul>
                  <li>Impact on Mental Health (anxiety, depression, paranoia)²</li>
                  <li>Effects on Brain Development (especially in teens)³</li>
                  <li>Impaired Driving & Safety Risks⁴</li>
                  <li>Decline in Motivation and Productivity¹</li>
                </ul>
              </div><br></br><br></br>

              <div className="learn-more-card">
                <h3>Treatment and Recovery</h3>
                <ul>
                  <li>Cognitive Behavioral Therapy (CBT)³</li>
                  <li>Support Groups & Peer Counseling¹</li>
                  <li>Holistic Approaches (yoga, meditation, mindfulness)⁴</li>
                  <li>Long-Term Sobriety Planning²</li>
                </ul>
              </div>
            </div>
          </section><br></br><br></br>

          {/* Section 3 */}
          <div className="info-section">
            <div className="info-text">
              <h2>Dangers of Marijuana Misuse</h2>
              <p>Excessive or prolonged marijuana use can cause:²</p>
              <div className="danger-points">
                <div className="danger-item">⚠️ Memory and attention problems²</div>
                <div className="danger-item">⚠️ Respiratory issues (when smoked)³</div>
                <div className="danger-item">⚠️ Anxiety, paranoia, or psychosis³</div>
                <div className="danger-item">⚠️ Impaired learning and work performance¹</div>
                <div className="danger-item">⚠️ Dependence and withdrawal symptoms⁴</div>
              </div>
            </div>
            <div className="info-image">
              <img src="/m.jpg" alt="Dangers of Marijuana Addiction" />
            </div>
          </div>
        </div><br></br><br></br>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Get Help for Marijuana Addiction</h2>
          <p>
            Seeking professional help for marijuana addiction can provide coping
            strategies, therapy, and peer support. Early treatment helps prevent
            long-term health and social impacts.³
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

        {/* References Section */}
        <section className="references hidden-section">
          <h2>References</h2>
          <ol>
            <li>National Institute on Drug Abuse (NIDA). Marijuana Research Report, 2020.</li>
            <li>Centers for Disease Control and Prevention (CDC). Cannabis and Public Health, 2021.</li>
            <li>Substance Abuse and Mental Health Services Administration (SAMHSA). Behavioral Health Trends, 2022.</li>
            <li>American Psychiatric Association (APA). Diagnostic and Statistical Manual of Mental Disorders (DSM-5).</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default MarijuanaInfo;
