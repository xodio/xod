import React from 'react';

const NoPatch = () => (
  <div className="NoPatch">
    <svg viewBox="0 0 295 162" className="logo">
      <defs>
        <filter id="inset-shadow">
          <feOffset dx="3" dy="3" />
          <feGaussianBlur stdDeviation="3" result="offset-blur" />
          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />
          <feFlood floodColor="black" floodOpacity="1" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComponentTransfer in="shadow" result="shadow">
            <feFuncA type="linear" slope=".25" />
          </feComponentTransfer>
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>
      <path
        d={`M120.521,0.5 L93.478,0.5 L60.582,57.424 L27.686,0.5 L0.643,0.5
            L47.06,80.822 L0.643,161.145 L27.686,161.145 L60.582,104.221
            L93.478,161.145 L120.521,161.145 L74.104,80.823 L120.521,0.5 Z
            M211.742,80.822 L165.576,0.761 L165.726,0.499 L138.28,0.499
            L138.431,0.762 L92.266,80.822 L138.431,160.882 L138.28,161.145
            L165.726,161.145 L165.576,160.883 L211.742,80.822 Z M119.412,80.822
            L152.004,24.299 L184.598,80.822 L152.004,137.345 L119.412,80.822 Z
            M248.573,0.5 L183.487,0.5 L198.018,24.717 L235.393,24.717
            L267.745,80.822 L235.393,136.926 L198.018,136.926 L183.487,161.144
            L248.573,161.144 L294.889,80.822 L248.573,0.5 Z`}
      />
    </svg>
  </div>
);

export default NoPatch;
