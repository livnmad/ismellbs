import React, { useState, useEffect } from 'react';
import './BullshitFact.css';

const facts = [
  "The U.S. government has spent over $1.5 trillion on a fighter jet that still doesn't work properly.",
  "Congress members can legally trade stocks based on insider information they learn in briefings.",
  "It's estimated that $138 billion in taxes go uncollected every year due to the 'tax gap'.",
  "The Pentagon failed its 6th consecutive audit in 2023 and can't account for over 60% of its assets.",
  "Pharmaceutical companies spend more on lobbying than on R&D for new drugs.",
  "The average congressional salary is $174,000, yet many members become millionaires while in office.",
  "The government pays $640 for a toilet seat and $7,600 for a coffee maker (historical Pentagon purchases).",
  "Super PACs can raise unlimited money from corporations and wealthy donors with minimal disclosure.",
  "The U.S. tax code is over 70,000 pages long - longer than the Bible, War and Peace, and the Harry Potter series combined.",
  "Congress has exempted itself from many workplace laws it imposed on private businesses.",
  "The government owns enough unused office space to fill the Empire State Building 7 times over.",
  "It costs taxpayers approximately $3.7 million per year to operate each member of Congress.",
  "Politicians can use campaign funds for personal expenses if they claim it's for 'campaign purposes'.",
  "The federal government spent $28 million studying why politicians lie (ironically).",
  "Congress members get their own private subway system under the Capitol that cost $19 million.",
];

const BullshitFact: React.FC = () => {
  const [currentFact, setCurrentFact] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  };

  const rotateFact = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentFact(getRandomFact());
      setIsAnimating(false);
    }, 500);
  };

  useEffect(() => {
    setCurrentFact(getRandomFact());
    
    // Rotate fact every 10 seconds
    const interval = setInterval(rotateFact, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bullshit-fact">
      <div className="fact-header">💩 BULLSHIT FACT 💩</div>
      <div className={`fact-content ${isAnimating ? 'fade-out' : 'fade-in'}`}>
        {currentFact}
      </div>
    </div>
  );
};

export default BullshitFact;
