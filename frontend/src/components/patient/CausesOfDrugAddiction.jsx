// CausesOfDrugAddiction.js
import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./CausesOfDrugAddiction.css";

export default function CausesOfDrugAddiction({ onBack }) {
  const navigate = useNavigate();

  return (
    <main className="causes-layout">
      {/* Header */}
      <header className="topbar">
        <div className="brand-logo">
          <img src="/logoo.png" alt="Recovery Road Logo" className="brand-image" loading="lazy" />
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

      {/* Hero Section */}
      <section className="causes-hero">
        <h1>Causes and Risk Factors for Addiction</h1>
        <p>
          Addiction, or substance use disorder (SUD), develops through a mix of genetic, 
          psychological, environmental, and social influences¹. It is not the result of a single 
          decision but rather the outcome of a range of interconnected factors. Understanding 
          these root causes is vital for prevention, treatment, and long-term recovery².
        </p>
      </section>

      {/* About Addiction */}
      <section className="causes-content">
        <article>
          <h2>About Addiction</h2>
          <p>
            Addiction is a chronic brain condition that alters the way people experience reward, 
            motivation, and self control³. Unlike casual or experimental use, addiction creates 
            a dependency where substances become central to daily life, often replacing healthy 
            activities, relationships, and responsibilities³.
          </p>
          <p>
            Addiction is not a matter of weak willpower. It involves structural and chemical 
            changes in the brain, particularly in regions linked to decision making, stress 
            response, and pleasure⁴. As a result, people with SUD may struggle to stop using 
            substances even when they recognize the harm it causes⁴.
          </p>
          <ul>
            <li>Developing tolerance, requiring higher amounts for the same effect³</li>
            <li>Withdrawal symptoms when stopping or reducing use³</li>
            <li>Prioritizing drug use over relationships, work, and health³</li>
            <li>Persistent cravings despite harmful consequences³</li>
            <li>Unsuccessful attempts to cut back or quit³</li>
          </ul>
        </article>

        <article>
          <h2>What Causes Addiction?</h2>
          <p>
            There is no single cause of addiction. Instead, it arises from a combination of 
            biological predispositions, life experiences, and environmental conditions¹. Some 
            people may experiment with substances casually and never develop problems, while 
            others, due to genetic or environmental vulnerabilities, quickly spiral into dependence².
          </p>
          <p>
            The more risk factors a person has such as family history, trauma, or social 
            influences the greater their likelihood of developing an addiction². Protective 
            factors like strong family support, positive friendships, and access to healthy 
            coping strategies can reduce that risk².
          </p>
        </article>

        <article>
  <h2>The Role of Brain Chemistry in Addiction</h2>
  <p>
    Addiction is strongly influenced by changes in the brain’s reward system¹. Substances like drugs and alcohol 
    trigger the release of dopamine, a neurotransmitter linked to pleasure and motivation¹. Over time, repeated 
    exposure can rewire the brain, making natural rewards such as food, relationships, or achievements less 
    satisfying².
  </p>
  <p>
    This neurological shift means that people struggling with addiction begin to prioritize substance use over 
    everyday responsibilities and well-being². The brain becomes conditioned to crave the substance, reinforcing 
    compulsive behaviors and making recovery more challenging³.
  </p>
</article>


        <article>
          <h2>Environmental Causes of Addiction</h2>
          <p>
            Environment is one of the strongest predictors of addiction². Factors such as 
            community norms, peer groups, and availability of substances shape a person’s 
            risk². For instance, living in a neighborhood where drug use is common can 
            normalize risky behavior, while exposure to strict anti drug education may 
            reduce experimentation².
          </p>
          <p>
            Family environment is equally critical³. A chaotic or neglectful household may 
            push individuals toward substances as an escape³, while strong parental guidance 
            and communication act as protective buffers³. School performance, financial 
            instability, and even media portrayals of drug use further influence risk³.
          </p>
        </article>

        <article>
          <h2>Can Trauma Cause Addiction?</h2>
          <p>
            Trauma is one of the most significant underlying causes of addiction⁴. Survivors 
            of physical abuse, emotional neglect, sexual assault, or exposure to violence 
            often turn to substances to numb overwhelming feelings of fear, shame, or pain⁴.
          </p>
          <p>
            Studies show that people with multiple Adverse Childhood Experiences (ACEs) 
            are far more likely to develop substance use disorders in adulthood⁴. Drugs 
            temporarily relieve distress, but over time, they worsen the emotional damage 
            and make recovery even more challenging⁴.
          </p>
        </article>

        <article>
          <h2>Mental Health as a Risk Factor</h2>
          <p>
            Mental health disorders such as depression, anxiety, post-traumatic stress 
            disorder (PTSD), and bipolar disorder frequently co-occur with addiction³. 
            People may use substances to cope with emotional pain or to self-medicate 
            untreated conditions³.
          </p>
          <p>
            This dual condition, known as a “co-occurring disorder” or “dual diagnosis,” 
            complicates treatment³. Addressing only the addiction without managing the 
            underlying mental health issue often leads to relapse³. Integrated treatment 
            that combines therapy, medication, and lifestyle changes is the most effective 
            approach³.
          </p>
        </article>

        <article>
          <h2>Can You Prevent Addiction?</h2>
          <p>
            Addiction is preventable through proactive strategies that build resilience 
            and awareness before risky behaviors develop². Early education programs that 
            teach children coping skills, emotional regulation, and the risks of substance 
            use are highly effective in prevention².
          </p>
          <p>
            Prevention also involves community and family involvement³. Parents who foster 
            open communication, schools that provide extracurricular activities, and 
            communities that offer healthy alternatives like sports, arts, and volunteering
            all help lower risk³. The earlier these measures are introduced, the stronger 
            their impact³.
          </p>
        </article>

        <article>
          <h2>Types of Addiction Treatment</h2>
          <p>
            While addiction is a chronic condition, effective treatment exists and 
            recovery is possible³. Treatment plans vary based on individual needs but 
            generally include a combination of medical support, counseling, and 
            long-term relapse prevention³.
          </p>
          <ul>
            <li>
              <strong>Detoxification:</strong> Medical supervision during withdrawal to 
              manage symptoms safely³.
            </li>
            <li>
              <strong>Inpatient Treatment:</strong> Residential care providing 
              structured therapy, peer support, and medical oversight³.
            </li>
            <li>
              <strong>Outpatient Programs:</strong> Flexible treatment options allowing 
              individuals to continue work or school while receiving care³.
            </li>
            <li>
              <strong>Peer Support Groups:</strong> 12-Step programs or group therapy 
              that build accountability and community³.
            </li>
            <li>
              <strong>Dual Diagnosis Treatment:</strong> Integrated care addressing both 
              addiction and mental health disorders³.
            </li>
          </ul>
          <p>
            Recovery is not linear. Relapse may occur, but it does not mean failure³ it 
            simply signals that adjustments to treatment are needed³. With ongoing support, 
            many individuals achieve long-term recovery and rebuild healthy, fulfilling lives³.
          </p>
        </article>
      </section>

      {/* References */}
      <section className="causes-references hidden">
        <h2>References</h2>
        <ul>
          <li>¹ National Institute on Drug Abuse (NIDA). Genetics and Addiction Research.</li>
          <li>² American Psychiatric Association. Risk Factors of Substance Use Disorders.</li>
          <li>³ World Health Organization (WHO). Understanding Mental Health and Substance Abuse.</li>
          <li>⁴ Centers for Disease Control and Prevention (CDC). Adverse Childhood Experiences (ACEs).</li>
        </ul>
      </section>
    </main>
  );
}
