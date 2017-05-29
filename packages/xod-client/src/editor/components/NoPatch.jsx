import React from 'react';

const NoPatch = () => (
  <div className="NoPatch" >
    <svg viewBox="55 112 894.66211 571.49609" className="logo">
      <defs>
        <filter id="inset-shadow">
          <feOffset dx="3" dy="3" />
          <feGaussianBlur stdDeviation="3" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="black" floodOpacity="1" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComponentTransfer in="shadow" result="shadow">
            <feFuncA type="linear" slope=".25" />
          </feComponentTransfer>
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
      <path
        d={`M 75.40039,112.28321 234.93555,388.60547 55,683.41602
            h 46.86133 L 257.71485,428.0625 405.14258,683.41602 h 46.18945
            L 281.45118,389.17383 450.44727,112.28321 H 403.58594
            L 258.66993,349.7168 121.58789,112.28321 Z`}
      />
      <path
        d={`m 517.54102,112.28321 -164.8125,285.46484 5.77344,10
           159.15625,275.66797 h 12.95703 L 695.54688,397.74805
           530.73438,112.28321 Z m 6.59766,68.57617 125.2207,216.88867
           -125.2207,216.88867 -125.22266,-216.88867 z`}
      />
      <path
        d={`m 580.74024,112 23.0957,40 H 761.5918 L 903.47461,397.74805
            761.5918,643.4961 H 603.90821 l -23.09375,40 H 784.68555
            L 949.66211,397.74805 784.68555,112 Z`}
      />
    </svg>
  </div>
);

export default NoPatch;
