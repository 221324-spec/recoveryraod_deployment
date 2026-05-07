// MentalHealth.js
import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./MentalHealth.css";

const softblue = "/softblue.jpeg";

const MentalHealth = ({ onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="damh-layout">
      {/* ✅ Header same as Learning Library */}
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
            <li onClick={onBack || (() => navigate("/gamedashboard"))}>🎮 Games</li>
            <li onClick={onBack || (() => navigate("/learninglibrary"))}>📚 Learning Library</li>
          </ul>
        </nav>
      </header>

      {/* ✅ Hero Section */}
      <header className="damh-hero" style={{backgroundImage: `url(${softblue})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
        <h1>Drug Addiction & Mental Health</h1>
        <p>
          Understanding the link between substance abuse and mental health is
          crucial to providing effective care and support for individuals facing
          these challenges <sup>1</sup>.
        </p>
      </header>

      {/* ✅ Main Content with Sidebar */}
      <div className="damh-content">
        {/* === Left: Main Article === */}
        <article className="damh-article">
          {/* Introduction */}
          <section className="damh-section">
            <h2>Introduction</h2>
            <p>
              Drug addiction is not just a physical dependency it deeply affects
              the mind, behavior, and emotional well-being. Mental health
              struggles such as depression, anxiety, and trauma often accompany
              addiction, creating a cycle that is difficult to break <sup>2</sup>.
              Addressing both aspects together is key to lasting recovery.
            </p>
          </section>

          {/* The Connection */}
          <section className="damh-section alt">
            <h2>The Connection Between Addiction and Mental Health</h2>
            <p>
              Mental health conditions can increase vulnerability to substance
              use, while prolonged drug use can worsen or trigger mental
              illnesses <sup>3</sup>. Common co-occurring disorders include:
            </p>
            <ul>
              <li>Depression and opioid misuse</li>
              <li>Anxiety and stimulant abuse</li>
              <li>Post traumatic stress disorder (PTSD) and alcohol misuse</li>
              <li>Bipolar disorder and substance dependence</li>
            </ul>
            <p>
              Recognizing this relationship allows professionals to design
              treatments that address the whole person rather than focusing on
              one condition alone <sup>4</sup>.
            </p>
          </section>

          {/* Causes & Risk Factors */}
          <section className="damh-section">
            <h2>Causes & Risk Factors</h2>
            <p>
              Drug addiction and mental illness rarely develop in isolation. A
              range of biological, psychological, and social factors contribute
              to their onset and persistence <sup>5</sup>:
            </p>
            <ul>
              <li>
                <strong>Genetic predisposition:</strong> A family history of
                addiction or mental illness increases vulnerability.
              </li>
              <li>
                <strong>Trauma and stress:</strong> Childhood abuse, neglect, or
                exposure to violence are major triggers.
              </li>
              <li>
                <strong>Social environment:</strong> Peer pressure, poverty, and
                lack of support networks amplify risks.
              </li>
              <li>
                <strong>Neurochemical imbalance:</strong> Drugs can alter brain
                chemistry, leading to mood instability and dependence.
              </li>
            </ul>
          </section>

          {/* Warning Signs */}
          <section className="damh-section alt">
            <h2>Warning Signs</h2>
            <p>
              Early detection can prevent long-term damage <sup>6</sup>. Some
              common signs include:
            </p>
            <ul>
              <li>Increased isolation or withdrawal from loved ones</li>
              <li>Sudden mood swings, irritability, or aggression</li>
              <li>Decline in school or work performance</li>
              <li>Neglect of personal hygiene or responsibilities</li>
              <li>Persistent cravings and inability to control use</li>
            </ul>
          </section>

          {/* Impact */}
          <section className="damh-section">
            <h2>Impact on Families & Society</h2>
            <p>
              Addiction and mental illness affect not only the individual but
              also their families, communities, and society as a whole
              <sup>7</sup>. Families often experience emotional stress,
              financial strain, and fractured relationships. On a larger scale,
              addiction contributes to rising healthcare costs, workplace
              absenteeism, and crime rates. Addressing these challenges requires
              a collective effort from healthcare systems, policymakers, and
              communities.
            </p>
          </section>

          {/* Recovery */}
          <section className="damh-section alt">
            <h2>Path to Recovery</h2>
            <p>
              Recovery requires a comprehensive approach. Effective programs
              combine medical treatment, therapy, community support, and
              lifestyle changes <sup>8</sup>. Strategies may include:
            </p>
            <ul>
              <li>Cognitive-behavioral therapy (CBT)</li>
              <li>Medication assisted treatment</li>
              <li>Peer support groups and counseling</li>
              <li>Mindfulness, exercise, and stress management</li>
            </ul>
            <p>
              Healing is not a one time event but a lifelong journey that
              requires resilience, patience, and consistent care.
            </p>
          </section>

          {/* Prevention */}
          <section className="damh-section">
            <h2>Prevention Strategies</h2>
            <p>
              Prevention is as important as treatment. Proactive measures can
              reduce the risk of addiction and mental health disorders
              <sup>9</sup>:
            </p>
            <ul>
              <li>
                Promoting mental health education in schools and communities
              </li>
              <li>Encouraging healthy coping mechanisms for stress</li>
              <li>Strengthening family bonds and social support systems</li>
              <li>
                Reducing stigma through awareness campaigns and open
                conversations
              </li>
            </ul>
          </section>

          {/* Resources */}
          <section className="damh-section alt">
            <h2>Resources & Support</h2>
            <p>
              If you or someone you know is struggling with addiction and mental
              health challenges, professional help is available <sup>10</sup>.
              Support can be found through:
            </p>
            <ul>
              <li>Local rehabilitation centers and hospitals</li>
              <li>Mental health hotlines and helplines</li>
              <li>Community-based recovery programs</li>
              <li>Online counseling platforms</li>
            </ul>
            <p>
              Reaching out is the first step toward recovery. No one should face
              these challenges alone.
            </p>
          </section>

          {/* Conclusion */}
          <section className="damh-section">
  <h2>Building Resilience</h2>
  <p>
    Strengthening resilience plays a vital role in preventing both addiction and mental health struggles¹². 
    When individuals develop healthy coping skills, emotional regulation, and strong social connections, 
    they are better equipped to manage life’s stressors without turning to harmful substances¹³. 
    Empowering people with education, support networks, and positive outlets creates a foundation for 
    long-term well-being and recovery.
  </p>
</section>


          {/* References */}
          <section className="references hidden-section">
            <h2>References</h2>
            <ol>
              <li>National Institute on Drug Abuse (2020). <em>Comorbidity: Substance Use Disorders and Other Mental Illnesses</em>. NIH.</li>
              <li>American Psychiatric Association (2018). <em>Substance Use Disorders and Mental Illness</em>.</li>
              <li>National Alliance on Mental Illness (2021). <em>Co-Occurring Disorders</em>.</li>
              <li>Substance Abuse and Mental Health Services Administration (SAMHSA) (2020). <em>Integrated Treatment for Co-Occurring Disorders</em>.</li>
              <li>Mayo Clinic (2019). <em>Drug Addiction: Symptoms and Causes</em>.</li>
              <li>World Health Organization (WHO) (2021). <em>Mental Health and Substance Use</em>.</li>
              <li>Centers for Disease Control and Prevention (CDC) (2020). <em>Substance Use and Public Health</em>.</li>
              <li>Harvard Medical School (2019). <em>Treatments for Substance Use and Mental Health Disorders</em>.</li>
              <li>United Nations Office on Drugs and Crime (UNODC) (2020). <em>Prevention of Drug Use and Treatment of Drug Use Disorders</em>.</li>
              <li>Mental Health America (2021). <em>Finding Help for Mental Health and Addiction</em>.</li>
              <li>National Institute of Mental Health (2021). <em>Mental Health and Substance Use: The Connection</em>.</li>
            </ol>
          </section> 
        </article>

        {/* === Right: Sidebar === */}
        <aside className="damh-sidebar">
          <div className="sidebar-box quick-facts">
            <h3>Quick Facts</h3>
            <ul>
              <li>1 in 4 people with addiction also has a mental health disorder.</li>
              <li>Untreated dual diagnosis increases relapse risk by 50%.</li>
              <li>Early intervention saves lives and reduces long-term costs.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MentalHealth;
